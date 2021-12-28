const cors = require('cors');
const request = require('request');
const express = require('express');
const paypal = require('paypal-rest-sdk');
const Cart = require('../models/Cart');

const CLIENT = 'AQX9vJhSkyNrGasUCsyw4jyHB5QhIEY84f6qZw0qxUOYBF69EQfs5bU8l5HwgZc9lGnqwgbmuFezv8hX'
const SECRET = 'EOQ1eS7AeMqPBtvYhh0GfUFQwEYn_bJHbveTn3OLrEfV-qdppwH3nR-jdkGCaFZf8ygzjRVmTrk-dIBe'

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': CLIENT,
    'client_secret': SECRET
});

exports.doPayment = async (req, res) => {

    const carts = await Cart.find();
    let precioFinal = 0;

    carts.forEach((cart) => {
        precioFinal = precioFinal + cart.idProduct.price;
    });


    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:7777/products",
            "cancel_url": "http://localhost:7777/cancel"
        },
        "transactions": [{
            
            "amount": {
                "currency": "EUR",
                "total": precioFinal
            },
            "description": "E-Commerce"
        }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    req.flash('success', 'Tu compra se ha realizado con exito');
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });


}
