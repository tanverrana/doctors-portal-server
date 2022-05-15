const express = require('express');
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.asxkv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db("doctors_portal").collection("services");
        const bookingCollection = client.db("doctors_portal").collection("booking");



        app.get("/service", async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);

        });

        app.get("/available", async (req, res) => {
            const date = req.query.date || "May 15, 2022";
            const services = await serviceCollection.find().toArray();

            const query = { date: date };
            const bookings = await bookingCollection.find(query).toArray();
            services.forEach(service => {
                const serviceBookings = bookings.filter(b => b.treatment === service.name);
                const booked = serviceBookings.map(s => s.slot);
                const available = service.slots.filter(s => !booked.includes(s));
                service.available = available;
            })
            res.send(services);
        })

        /**
 * Api Naming Convention
 * app.get("/booking")// get all the booking. or get more than one or by filter 
 * app.get("/booking:id")// get a specific booking
 * app.post("/booking") // add a new booking
 * app.patch("/booking/:id") //
 * app.delete("/booking/:id")
 */
        app.post("/booking", async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = bookingCollection.insertOne(booking);
            res.send({ success: true, result });
        })


    }
    finally {

    }

}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello From Doctors Portal!')
})

app.listen(port, () => {
    console.log(`Doctors Portal app listening on port ${port}`)
})