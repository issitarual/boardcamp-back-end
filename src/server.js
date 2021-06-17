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

// início da rota categories

//pega a array com as informações de categorias
app.get("/categories", async (req,res) => {
    try{
        const categories = await connection.query('SELECT * FROM categories');
        res.send(categories.rows);
    }catch{
        res.sendStatus(400);
    };
});

//insere uma nova categoria

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

//fim da rota de categorias

//inicio da rota de games
//pega a array com as informações de games 

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
        for(let i = 0; i < games.rows.length; i++){
            for(let j = 0; j < categories.rows.length;j++){
                if(games.rows[i].categoryId === categories.rows[j].id){
                    games.rows[i].categoryName = categories.rows[j].name;
                }
            }
        }
        res.send(games.rows);
    }catch {
        res.sendStatus(400);
    };
});

//insere um novo jogo em games

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

//fim da rota games

//início da rota de clientes
//buscar informações dos clientes
app.get("/customers", async (req,res) => {
    const { cpf } = req.query;
    if(cpf){
        const userSchema = joi.object({
            cpf: joi.number()
        });
        const { error, value } = userSchema.validate({
            cpf: cpf
        });
        if(error){
            res.sendStatus(400);
            return;
        }
    }
    try{
        let costumers = []
        if(cpf){
            costumers = await connection.query('SELECT * FROM customers WHERE cpf LIKE $1', [cpf+"%"]);
        }
        else{
            costumers = await connection.query('SELECT * FROM customers');
        }
        res.send(costumers.rows);
    }catch {
        res.sendStatus(400);
    };
});

app.listen(4000, () =>{
    console.log("Porta 4000!");
});