import { Request, Response } from 'express';
import { Trip } from '../models/Trip';
import { Bus } from '../models/Bus';
import { Route } from '../models/Route';
import { Booking } from '../models/Booking';
import { asyncHandler } from '../utils/responseHandler';
import { sendSuccess, sendError, sendNotFound, sendBadRequest } from '../utils/responseHandler';
import { logError } from '../utils/logger';

// Search buses for booking
export const searchBuses = asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      from,
      to,
      departureDate,
      passengers = 1,
      busType,
      sortBy = 'price',
      minPrice,
      maxPrice,
      amenities,
    } = req.query;

    if (!from || !to || !departureDate) {
      return sendBadRequest(res, 'From, to, and departure date are required');
    }

    const searchDate = new Date(departureDate as string);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Build route filter
    const routeFilter: any = {
      isActive: true,
      $or: [
        {
          'from.city': { $regex: from, $options: 'i' },
          'to.city': { $regex: to, $options: 'i' },
        },
        {
          'from.state': { $regex: from, $options: 'i' },
          'to.state': { $regex: to, $options: 'i' },
        },
      ],
    };

    // Find matching routes
    const routes = await Route.find(routeFilter);
    const routeIds = routes.map(route => route._id);

    if (routeIds.length === 0) {
      return sendSuccess(res, [], 'No routes found');
    }

    // Build trip filter
    const tripFilter: any = {
      route: { $in: routeIds },
      departureDate: {
        $gte: searchDate,
        $lt: nextDay,
      },
      status: { $in: ['scheduled', 'in_progress'] },
      availableSeats: { $gte: Number(passengers) },
    };

    // Build bus filter
    const busFilter: any = {
      status: 'active',
    };

    if (busType) {
      busFilter.type = busType;
    }

    if (minPrice || maxPrice) {
      tripFilter.fare = {};
      if (minPrice) tripFilter.fare.$gte = Number(minPrice);
      if (maxPrice) tripFilter.fare.$lte = Number(maxPrice);
    }

    // Find trips with populated data
    let trips = await Trip.find(tripFilter)
      .populate({
        path: 'route',
        select: 'routeName from to distance duration basePrice',
      })
      .populate({
        path: 'bus',
        match: busFilter,
        select: 'busNumber busName type totalSeats amenities features images operator',
        populate: {
          path: 'operator',
          select: 'name',
        },
      })
      .populate('driver', 'name')
      .populate('helper', 'name')
      .sort({ departureTime: 1 });

    // Filter out trips with no bus (due to bus filter)
    trips = trips.filter(trip => trip.bus);

    // Filter by amenities if specified
    if (amenities) {
      const amenityList = (amenities as string).split(',');
      trips = trips.filter(trip => {
        const busAmenities = (trip.bus as any).amenities || [];
        return amenityList.every(amenity => 
          busAmenities.some((busAmenity: string) => 
            busAmenity.toLowerCase().includes(amenity.toLowerCase())
          )
        );
      });
    }

    // Sort results
    switch (sortBy) {
      case 'price':
        trips.sort((a, b) => a.fare - b.fare);
        break;
      case 'departure':
        trips.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
        break;
      case 'duration':
        trips.sort((a, b) => ((a.route as any).duration || 0) - ((b.route as any).duration || 0));
        break;
      case 'arrival':
        trips.sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime));
        break;
      default:
        trips.sort((a, b) => a.fare - b.fare);
    }

    // Format response
    const formattedTrips = trips.map(trip => ({
      id: trip._id,
      tripNumber: trip.tripNumber,
      operator: (trip.bus as any).operator?.name || 'Unknown',
      busNumber: (trip.bus as any).busNumber,
      busName: (trip.bus as any).busName,
      busType: (trip.bus as any).type,
      from: (trip.route as any).from,
      to: (trip.route as any).to,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      duration: (trip.route as any).duration,
      price: trip.fare,
      availableSeats: trip.availableSeats,
      totalSeats: (trip.bus as any).totalSeats,
      amenities: (trip.bus as any).amenities || [],
      features: (trip.bus as any).features || {},
      images: (trip.bus as any).images || [],
      driver: (trip.driver as any)?.name,
      helper: (trip.helper as any)?.name,
      pickupPoints: trip.pickupPoints,
      dropPoints: trip.dropPoints,
    }));

    return sendSuccess(res, {
      trips: formattedTrips,
      total: formattedTrips.length,
      searchCriteria: {
        from,
        to,
        departureDate,
        passengers,
        busType,
        sortBy,
        minPrice,
        maxPrice,
        amenities,
      },
    }, 'Bus search completed successfully');
  } catch (error) {
    logError('Error searching buses:', error);
    return sendError(res, 'Failed to search buses');
  }
});

// Get popular routes
export const getPopularRoutes = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const popularRoutes = await Booking.aggregate([
      {
        $lookup: {
          from: 'routes',
          localField: 'route',
          foreignField: '_id',
          as: 'routeData',
        },
      },
      { $unwind: '$routeData' },
      {
        $group: {
          _id: {
            routeId: '$route',
            routeName: '$routeData.routeName',
            from: '$routeData.from.city',
            to: '$routeData.to.city',
            state: '$routeData.from.state',
          },
          totalBookings: { $sum: 1 },
          totalPassengers: { $sum: { $size: '$seats' } },
          averagePrice: { $avg: '$totalAmount' },
        },
      },
      { $sort: { totalBookings: -1 } },
      { $limit: Number(limit) },
    ]);

    return sendSuccess(res, popularRoutes, 'Popular routes retrieved successfully');
  } catch (error) {
    logError('Error fetching popular routes:', error);
    return sendError(res, 'Failed to fetch popular routes');
  }
});

// Get available seats for a trip
export const getAvailableSeats = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId)
      .populate('bus', 'totalSeats')
      .populate('route', 'routeName from to');

    if (!trip) {
      return sendNotFound(res, 'Trip not found');
    }

    // Get booked seats for this trip
    const bookings = await Booking.find({
      trip: tripId,
      bookingStatus: { $in: ['confirmed', 'pending'] },
    });

    const bookedSeats = new Set();
    bookings.forEach(booking => {
      booking.seats.forEach(seat => {
        bookedSeats.add(seat.seatNumber);
      });
    });

    // Generate seat layout
    const totalSeats = (trip.bus as any).totalSeats;
    const seats = [];
    
    for (let i = 1; i <= totalSeats; i++) {
      seats.push({
        seatNumber: i,
        isAvailable: !bookedSeats.has(i),
        isSelected: false,
      });
    }

    return sendSuccess(res, {
      trip: {
        id: trip._id,
        tripNumber: trip.tripNumber,
        route: trip.route,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        fare: trip.fare,
      },
      seats,
      totalSeats,
      availableSeats: seats.filter(seat => seat.isAvailable).length,
      bookedSeats: seats.filter(seat => !seat.isAvailable).length,
    }, 'Available seats retrieved successfully');
  } catch (error) {
    logError('Error fetching available seats:', error);
    return sendError(res, 'Failed to fetch available seats');
  }
});

// Get trip details for booking
export const getTripDetails = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId)
      .populate('route', 'routeName from to distance duration stops')
      .populate('bus', 'busNumber busName type totalSeats amenities features images operator')
      .populate('driver', 'name phone licenseNumber')
      .populate('helper', 'name phone')
      .populate({
        path: 'bus.operator',
        select: 'name email phone',
      });

    if (!trip) {
      return sendNotFound(res, 'Trip not found');
    }

    // Get recent bookings for this trip
    const recentBookings = await Booking.find({
      trip: tripId,
      bookingStatus: { $in: ['confirmed', 'pending'] },
    })
      .populate('user', 'name')
      .select('seats totalAmount bookingStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const tripDetails = {
      id: trip._id,
      tripNumber: trip.tripNumber,
      route: trip.route,
      bus: trip.bus,
      driver: trip.driver,
      helper: trip.helper,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      departureDate: trip.departureDate,
      pickupPoints: trip.pickupPoints,
      dropPoints: trip.dropPoints,
      fare: trip.fare,
      availableSeats: trip.availableSeats,
      status: trip.status,
      recentBookings,
    };

    return sendSuccess(res, tripDetails, 'Trip details retrieved successfully');
  } catch (error) {
    logError('Error fetching trip details:', error);
    return sendError(res, 'Failed to fetch trip details');
  }
});

// Get search suggestions
export const getSearchSuggestions = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { query, type = 'all' } = req.query;

    if (!query || (query as string).length < 2) {
      return sendSuccess(res, [], 'Search suggestions retrieved successfully');
    }

    const searchQuery = { $regex: query, $options: 'i' };
    const suggestions = [];

    if (type === 'all' || type === 'cities') {
      // Get city suggestions from routes
      const citySuggestions = await Route.aggregate([
        {
          $match: {
            isActive: true,
            $or: [
              { 'from.city': searchQuery },
              { 'to.city': searchQuery },
              { 'from.state': searchQuery },
              { 'to.state': searchQuery },
            ],
          },
        },
        {
          $group: {
            _id: null,
            cities: {
              $addToSet: {
                $concat: ['$from.city', ', ', '$from.state'],
              },
            },
            destinations: {
              $addToSet: {
                $concat: ['$to.city', ', ', '$to.state'],
              },
            },
          },
        },
      ]);

      if (citySuggestions.length > 0) {
        const allCities = [
          ...citySuggestions[0].cities,
          ...citySuggestions[0].destinations,
        ];
        suggestions.push(...allCities.map(city => ({ type: 'city', value: city })));
      }
    }

    if (type === 'all' || type === 'routes') {
      // Get route suggestions
      const routeSuggestions = await Route.find({
        isActive: true,
        routeName: searchQuery,
      })
        .select('routeName from to')
        .limit(5);

      suggestions.push(
        ...routeSuggestions.map(route => ({
          type: 'route',
          value: route.routeName,
          from: route.from,
          to: route.to,
        }))
      );
    }

    return sendSuccess(res, suggestions.slice(0, 10), 'Search suggestions retrieved successfully');
  } catch (error) {
    logError('Error fetching search suggestions:', error);
    return sendError(res, 'Failed to fetch search suggestions');
  }
});
