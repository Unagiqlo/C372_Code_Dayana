const payments = [
    { petName: "Chester", amount:50, status: "APPROVED" },
    { petName: "Mochi", amount: 80, status: "PENDING" },
    { petName: "Mira", amount: 40, status: "DECLINED" }
];


// a) Display Mochi's payment status
const mochi = payments.find(payment => payment.petName === "Mochi");

console.log("Mochi's payment status: " + mochi.status);

// b) Use a loop to display payment details for each pet
for (const payment of payments) {
    if (payment.status === "APPROVED") {
        console.log(`Pet-care service for ${payment.petName} confirmed`);
    } else if (payment.status === "PENDING") {
        console.log(`Payment for ${payment.petName} is being processed`);
    } else if (payment.status === "DECLINED") {
        console.log(`Payment for ${payment.petName} unsuccessful`);
    }
}