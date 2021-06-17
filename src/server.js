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
        name: joi.string().min(1).required().pattern(/[a-zA-Z]/),
    });
    const { error, value } = userSchema.validate({name: name});
    if(error){
        res.sendStatus(400);
        return;
    }
    try{
        const categorieValidation = await connection.query('SELECT * FROM categories WHERE name = $1',[name]);
        if(categorieValidation.rows[0]){
            res.sendStatus(409);
            return;
        }
        await connection.query('INSERT INTO categories (name) VALUES ($1)',[name]);
        res.sendStatus(201);
    } catch{
        res.sendStatus(400);
    };
});

app.get("/games", async (req,res) => {
    const { name } = req.query;
    try{
        let games = []
        if(name){
            games = await connection.query('SELECT * FROM games WHERE name ILIKE $1', [name+"%"]);
        }
        else{
            games = await connection.query('SELECT * FROM games');
        }
        const categories = await connection.query('SELECT * FROM categories');
        for(let i = 0; i < categories.length; i++){
            games.rows.map(n => n.categoryId === categories[i].id? n.categoryName = categories[i].name: null)
        }
        res.send(games.rows);
    }catch {
        res.sendStatus(400);
    };
});

app.post("/games", async (req,res) => {
    const { name, image, stockTotal, categoryId, pricePerDay } = req.body;
    const userSchema = joi.object({
        name: joi.string().min(1).required().pattern(/[a-zA-Z]/),
        stockTotal: joi.number().min(1).required(),
        pricePerDay: joi.number().min(1).required(),
        categoryId: joi.number().min(1).required()
    });
    const { error, value } = userSchema.validate({
        name: name, 
        stockTotal: stockTotal, 
        pricePerDay: pricePerDay,
        categoryId: categoryId
    });
    if(error){
        res.sendStatus(400);
        return;
    }
    try{
        const gameValidation = await connection.query('SELECT * FROM games WHERE name = $1',[name]);
        const categorieValidation = await connection.query('SELECT * FROM categories WHERE id = $1',[categoryId]);
        if(gameValidation.rows[0]){
            res.sendStatus(409);
            return;
        }
        else if(!categorieValidation.rows[0]){
            res.sendStatus(400);
            return;
        }
        await connection.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)',[name, image, stockTotal, categoryId, pricePerDay]);
        res.sendStatus(201);
    } catch{
        res.sendStatus(400);
    };
});

app.listen(4000, () =>{
    console.log("Porta 4000!");
});