const connection = require('../config/db');

function createPendingBooking(ownerId, petId, serviceId, bookingDate, callback) {
  connection.getConnection((connectionError, transactionConnection) => {
    if (connectionError) return callback(connectionError);

    let finished = false;
    const finish = (err, result) => {
      if (finished) return;
      finished = true;
      transactionConnection.release();
      callback(err, result);
    };

    const rollback = (err, result) => {
      transactionConnection.rollback((rollbackError) => {
        if (err && rollbackError) {
          err.rollbackError = rollbackError;
        }
        const finalError = err || rollbackError;
        finish(finalError, finalError ? undefined : result);
      });
    };

    transactionConnection.beginTransaction((beginError) => {
      if (beginError) return finish(beginError);

      const bookingSql = `
        INSERT INTO service_bookings
          (pet_id, service_id, booking_status, booked_price, booking_date)
        SELECT pets.id, services.id, 'pending', services.price, ?
        FROM pets
        JOIN services ON services.id = ?
        WHERE pets.id = ?
          AND pets.owner_id = ?
          AND services.is_active = 1
      `;
      transactionConnection.query(
        bookingSql,
        [bookingDate, serviceId, petId, ownerId],
        (bookingError, bookingResult) => {
          if (bookingError) return rollback(bookingError);
          if (bookingResult.affectedRows === 0) {
            return rollback(null, null);
          }
          if (bookingResult.affectedRows !== 1) {
            return rollback(new Error('Unexpected number of service bookings created.'));
          }

          const bookingId = bookingResult.insertId;
          const paymentSql = `
            INSERT INTO payments (booking_id, amount, payment_status)
            SELECT id, booked_price, 'pending'
            FROM service_bookings
            WHERE id = ?
          `;
          transactionConnection.query(paymentSql, [bookingId], (paymentError, paymentResult) => {
            if (paymentError) return rollback(paymentError);
            if (paymentResult.affectedRows !== 1) {
              return rollback(new Error('Unable to create the booking payment.'));
            }

            transactionConnection.commit((commitError) => {
              if (commitError) return rollback(commitError);
              finish(null, { bookingId, paymentId: paymentResult.insertId });
            });
          });
        }
      );
    });
  });
}

function getBookingsByOwner(ownerId, callback) {
  const sql = `
    SELECT
      service_bookings.id AS booking_id,
      DATE_FORMAT(service_bookings.booking_date, '%Y-%m-%d') AS booking_date,
      pets.name AS pet_name,
      services.name AS service_name,
      service_bookings.booked_price,
      service_bookings.booking_status,
      payments.payment_status,
      payments.payment_reference,
      service_bookings.created_at
    FROM service_bookings
    JOIN pets ON pets.id = service_bookings.pet_id
    JOIN services ON services.id = service_bookings.service_id
    LEFT JOIN payments ON payments.booking_id = service_bookings.id
    WHERE pets.owner_id = ?
    ORDER BY service_bookings.created_at DESC, service_bookings.id DESC
  `;
  connection.query(sql, [ownerId], callback);
}

module.exports = {
  createPendingBooking,
  getBookingsByOwner
};
