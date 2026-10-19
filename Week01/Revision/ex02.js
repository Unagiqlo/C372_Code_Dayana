const paymentStatus = "APPROVED";

// Check the payment status and display the appropriate message
if (paymentStatus === "APPROVED") {
    console.log("Pet-care service confirmed");
}
else if (paymentStatus === "PENDING") {
    console.log("Payment is being processed");
}

else {
    console.log("Payment unsuccessful");
}