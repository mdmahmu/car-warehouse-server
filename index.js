import express from 'express';
import cors from 'cors';
import { MongoClient, ServerApiVersion } from 'mongodb';
const app = express();
const port = process.env.PORT || 5000;


app.use(express.json());
app.use(cors());

const uri = "mongodb+srv://dbusermmm:dbusermmmhdu@cluster0.pxon5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    try {
        await client.connect();
        const carsCollection = client.db("carWarehouse").collection("cars");

        app.post('/cars', async (req, res) => {
            const newCar = req.body;
            const result = await carsCollection.insertOne(newCar);
            res.send({ result });
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