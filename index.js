import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(express.json());
app.use(cors());

//verifying jwt
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    });
}

//database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pxon5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const carsCollection = client.db("carWarehouse").collection("cars");

        //auth
        app.post('/login', async (req, res) => {
            const email = req.body;
            const jwtAccessToken = jwt.sign(email, process.env.ACCESS_TOKEN, { expiresIn: '30d' });
            res.send({ jwtAccessToken });
        });

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

        // Update quantity and restock
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
                    newSold = parseInt(findDetails.quantity) == 0 ? findDetails?.sold : parseInt(findDetails.sold) + 1;
                    updateDoc = {
                        $set: {
                            quantity: newQuantity,
                            sold: newSold
                        },
                    };
                }
            }
            else {
                newQuantity = parseInt(findDetails.quantity) + parseInt(updateData.quantity);
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

        //get my items
        app.get('/my_items', verifyJWT, async (req, res) => {
            const decodedEmailOrUid = req.query.emailOrUid;
            const emailOrUid = req.query.emailOrUid;
            if (emailOrUid === decodedEmailOrUid) {
                const query = { emailOrUid: emailOrUid };
                const result = carsCollection.find(query);
                const myItems = await result.toArray();
                res.send(myItems);
            } else {
                res.status(403).send({ message: 'forbidden access' });
            }
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