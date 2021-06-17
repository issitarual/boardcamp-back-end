import express from 'express';
import cors from 'cors';
import pg from 'pg';
import joi from 'joi';

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;
const databaseConnection = {
    user: 'bootcamp_role',
    password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
    host: 'localhost',
    port: 5432,
    database: 'boardcamp'
  };
const connection = new Pool(databaseConnection);

app.get("/categories", async (req,res) => {
    try{
        const categories = await connection.query('SELECT * FROM categories');
        res.send(categories.rows);
    }catch{
        res.sendStatus(400);
    };
});

app.post("/categories", async (req,res) => {
    const { name } = req.body;
    const userSchema = joi.object({
        name: joi.string().min(1).required(),
    });
    const { error, value } = userSchema.validate({name: name});
    if(error){
        res.sendStatus(400);
    }
    try{
        const categorieValidation = await connection.query('SELECT * FROM categories WHERE name = $1',[name]);
        if(categorieValidation.rows[0]){
            res.sendStatus(409);
            return;
        }
            await connection.query('INSERT INTO categories (name) VALUES ($1)',[name])
            res.sendStatus(201);
        }catch{
            res.sendStatus(400);
        };
});

app.listen(4000, () =>{
    console.log("Porta 4000!");
});