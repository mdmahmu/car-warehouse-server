import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(express.json());
app.use(cors());

//database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pxon5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    try {
        await client.connect();
        const carsCollection = client.db("carWarehouse").collection("cars");

        // GET all cars
        app.get('/cars', async (req, res) => {
            const query = {};
            const cursor = carsCollection.find(query);
            const cars = await cursor.toArray();
            res.send(cars);
        });

        // GET single car
        app.get('/cars/:inventoryId', async (req, res) => {
            const id = req.params.inventoryId;
            const query = { _id: ObjectId(id) };
            const result = await carsCollection.findOne(query);
            res.send(result);
        });

        // POST car
        app.post('/cars', async (req, res) => {
            const newCar = req.body;
            const result = await carsCollection.insertOne(newCar);
            res.send({ result });
        });

        // Update quantity by 1
        app.put('/cars/:inventoryId', async (req, res) => {
            const id = req.params.inventoryId;
            const updateData = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const findDetails = await carsCollection.findOne(filter);
            let updateDoc, newQuantity, newSold;

            if (updateData.sold) {
                if (findDetails.quantity > 0) {
                    newQuantity = parseInt(findDetails.quantity) - 1;
                    newSold = findDetails.quantity == 0 ? findDetails?.sold : findDetails.sold + 1;
                    updateDoc = {
                        $set: {
                            quantity: newQuantity,
                            sold: newSold
                        },
                    };
                }
            }
            else {
                newQuantity = findDetails.quantity + parseInt(updateData.quantity);
                updateDoc = {
                    $set: {
                        quantity: newQuantity
                    },
                };
            }
            const result = await carsCollection.updateOne(filter, updateDoc, options);
            res.send({ result });
        });

        //deleting a item
        app.delete('/cars/:inventoryId', async (req, res) => {
            const id = req.params.inventoryId;
            const query = { _id: ObjectId(id) };
            const result = await carsCollection.deleteOne(query);
            res.send(result);
        });
    }
    finally {
        // await client.close();
    }

}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello');
});

app.listen(port, () => {
    console.log('app listening on port', port);
});