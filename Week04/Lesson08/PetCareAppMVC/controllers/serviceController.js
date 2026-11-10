const petModel = require('../models/petModel');
const serviceModel = require('../models/serviceModel');
const serviceBookingModel = require('../models/serviceBookingModel');

const BOOKING_SUCCESS = 'Booking created. Payment is pending; no payment has been processed.';
const INVALID_BOOKING = 'Choose a pet, service, and valid booking date.';
const UNAVAILABLE_BOOKING = 'That pet or service is unavailable for booking.';
const BOOKING_FAILURE = 'Unable to create the booking. Please try again.';

function getToday() {
  const now = new Date();
  const year = String(now.getFullYear()).padStart(4, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isPositiveIntegerId(value) {
  return typeof value === 'string'
    && /^[1-9]\d*$/.test(value)
    && Number.isSafeInteger(Number(value));
}

function isValidBookingDate(value, today) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  if (year < 1000 || year > 9999) return false;

  const parsedDate = new Date(year, month - 1, day);
  const exists = parsedDate.getFullYear() === year
    && parsedDate.getMonth() === month - 1
    && parsedDate.getDate() === day;

  return exists && value >= today;
}

function listServices(req, res) {
  const ownerId = req.session.user.id;

  petModel.getPetsByOwner(ownerId, (petError, pets) => {
    if (petError) {
      console.error('Error loading pets for service booking:', petError);
      return res.status(500).send('Unable to load pets.');
    }

    serviceModel.getActiveServices((serviceError, services) => {
      if (serviceError) {
        console.error('Error loading services:', serviceError);
        return res.status(500).send('Unable to load services.');
      }

      const requestedPetId = req.query.petId == null ? '' : String(req.query.petId);
      const selectedPet = pets.find((pet) => String(pet.id) === requestedPetId);

      return res.render('services', {
        pets,
        services,
        selectedPetId: selectedPet ? String(selectedPet.id) : '',
        today: getToday(),
        messages: req.flash('success'),
        errors: req.flash('error'),
        session: req.session
      });
    });
  });
}

function createBooking(req, res) {
  const { petId, serviceId, bookingDate } = req.body;
  const today = getToday();

  if (!isPositiveIntegerId(petId)
    || !isPositiveIntegerId(serviceId)
    || !isValidBookingDate(bookingDate, today)) {
    req.flash('error', INVALID_BOOKING);
    return res.redirect('/services');
  }

  serviceBookingModel.createPendingBooking(
    req.session.user.id,
    Number(petId),
    Number(serviceId),
    bookingDate,
    (err, booking) => {
      if (err) {
        console.error('Error creating service booking:', err);
        req.flash('error', BOOKING_FAILURE);
        return res.redirect(`/services?petId=${encodeURIComponent(petId)}`);
      }

      if (!booking) {
        req.flash('error', UNAVAILABLE_BOOKING);
        return res.redirect('/services');
      }

      req.flash('success', BOOKING_SUCCESS);
      return res.redirect('/bookings');
    }
  );
}

function listBookings(req, res) {
  serviceBookingModel.getBookingsByOwner(req.session.user.id, (err, bookings) => {
    if (err) {
      console.error('Error loading booking history:', err);
      return res.status(500).send('Unable to load booking history.');
    }

    return res.render('bookings', {
      bookings,
      messages: req.flash('success'),
      errors: req.flash('error'),
      session: req.session
    });
  });
}

module.exports = { listServices, createBooking, listBookings };
