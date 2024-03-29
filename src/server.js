import express from 'express';
import cors from 'cors';
import pg from 'pg';
import joi from 'joi';
import dayjs from 'dayjs';

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
    const { offset, limit, order, desc } = req.query;
    try{
        const categories = await connection.query(`
            SELECT * 
            FROM categories 
            LIMIT $1 OFFSET $2`, [limit? limit:null, offset? offset:0]);
        res.send(categories.rows);
    }catch {
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
    const { name, offset, limit } = req.query;
    try{
        let games = []
        if(name){
            games = await connection.query(`
                SELECT games.*, categories.name AS "categoryName"
                FROM games JOIN categories
                ON games."categoryId" = categories.id
                WHERE games.name ILIKE $1
                LIMIT $2 OFFSET $3`, [name+"%", limit? limit:null, offset? offset:0]);
        }
        else{
            games = await connection.query(`
                SELECT games.*, categories.name AS "categoryName"
                FROM games JOIN categories
                ON games."categoryId" = categories.id
                LIMIT $1 OFFSET $2`, [limit? limit:null, offset? offset:0]);
        }
        res.send(games.rows);
    }catch (e){
        console.log(e);
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
    const { cpf, limit, offset } = req.query;
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
        let customers = []
        if(cpf){
            customers = await connection.query('SELECT * FROM customers WHERE cpf LIKE $1 LIMIT $2 OFFSET $3', [cpf+"%", limit? limit:null, offset? offset:0]);
        }
        else{
            customers = await connection.query('SELECT * FROM customers LIMIT $1 OFFSET $2',[limit? limit:null, offset? offset:0]);
        }
        for(let i = 0; i < customers.rows.length; i++){
            customers.rows[i].birthday = dayjs(customers.rows[i].birthday).format('YYYY-MM-DD');
        }
        res.send(customers.rows);
    }catch {
        res.sendStatus(400);
    };
});

//buscar cliente pelo id
app.get("/customers/:id", async (req,res) => {
    const { id } = req.params;
    if(id){
        const userSchema = joi.object({
            id: joi.number().min(1)
        });
        const { error, value } = userSchema.validate({
            id: id
        });
        if(error){
            res.sendStatus(400);
            return;
        }
    }
    try{
        const customers = await connection.query('SELECT * FROM customers WHERE id = $1', [id]);
        if(!customers.rows[0]){
            res.sendStatus(404);
            return;
        }
        res.send(customers.rows[0]);
    }catch {
        res.sendStatus(400);
    };
});

//insere um novo cliente
app.post("/customers", async (req,res) => {
    const { name, phone, cpf, birthday } = req.body;
    const userSchema = joi.object({
        name: joi.string().min(1).required().pattern(/[a-zA-Z]/),
        phone: joi.string().required().pattern(/[0-9]{10,11}/),
        cpf: joi.string().required().pattern(/[0-9]{11}/),
        birthday: joi.string().required().pattern(/^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/)
    });
    const { error, value } = userSchema.validate({
        name: name, 
        phone: phone,
        cpf: cpf,
        birthday:birthday
    });
    const birthdayValidation = dayjs(birthday, 'YYYY-MM-DD').isValid();
    if(error || !birthdayValidation){
        res.sendStatus(400);
        return;
    }
    try{
        const cpfValidation = await connection.query('SELECT * FROM customers WHERE cpf = $1',[cpf]);
        if(cpfValidation.rows[0]){
            res.sendStatus(409);
            return;
        }
        await connection.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)',[name, phone, cpf, birthday]);
        res.sendStatus(201);
    } catch{
        res.sendStatus(400);
    };
});

//altera dados de um cliente
app.put("/customers/:id", async (req,res) => {
    const { id } = req.params;
    const { name, phone, cpf, birthday } = req.body;
    const userSchema = joi.object({
        name: joi.string().min(1).required().pattern(/[a-zA-Z]/),
        phone: joi.string().required().pattern(/[0-9]{10,11}/),
        cpf: joi.string().required().pattern(/[0-9]{11}/),
        birthday: joi.string().required().pattern(/^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/)
    });
    const { error, value } = userSchema.validate({
        name: name, 
        phone: phone,
        cpf: cpf,
        birthday:birthday
    });
    const birthdayValidation = dayjs(birthday, 'YYYY-MM-DD').isValid();
    if(error || !birthdayValidation){
        res.sendStatus(400);
        return;
    }
    try{
        const cpfValidation = await connection.query('SELECT * FROM customers WHERE cpf = $1',[cpf]);
        if(cpfValidation.rows[0]){
            res.sendStatus(409);
            return;
        }
        await connection.query('UPDATE customers SET name=$1, phone=$2, cpf=$3, birthday=$4 WHERE id=$5',[name, phone, cpf, birthday, id]);
        res.sendStatus(200);
    } catch{
        res.sendStatus(400);
    };
});
//fim da rota customers

//início da rota rentals
//pega as informações dos alugueis
app.get("/rentals", async (req,res) => {
    const { customerId, gameId } = req.params;
    const { limit, offset } = req.query;
    const userSchema = joi.object({
        id: joi.number().min(1).required()
    });
    try{
        let rentals = []
        if(customerId){
            const { error, value } = userSchema.validate({
                id: customerId
            });
            if(error){
                res.sendStatus(400);
                return;
            }
            rentals = await connection.query(`
                SELECT rentals.*, customers.name AS "customerName", games.name AS "gameName", games."categoryId", categories.name AS "categoryName"
                FROM rentals 
                JOIN customers
                ON rentals."customerId" = customers.id 
                JOIN games
                ON rentals."gameId" = games.id 
                JOIN categories
                ON games."categoryId" = categories.id
                WHERE rentals."customerId" LIKE $1 
                LIMIT $2 OFFSET $3`, [customerId, limit? limit:null, offset? offset:0]
            );
        }
        else if(gameId){
            const { error, value } = userSchema.validate({
                id: gameId
            });
            if(error){
                res.sendStatus(400);
                return;
            }
            rentals = await connection.query(`
                SELECT rentals.*, customers.name AS "customerName", games.name AS "gameName", games."categoryId", categories.name AS "categoryName"
                FROM rentals 
                JOIN customers
                ON rentals."customerId" = customers.id 
                JOIN games
                ON rentals."gameId" = games.id 
                JOIN categories
                ON games."categoryId" = categories.id
                WHERE rentals."gameId" ILIKE $1 
                LIMIT $2 OFFSET $3`, [gameId, limit? limit:null, offset? offset:0]
            );
        }
        else{
            rentals = await connection.query(`
                SELECT rentals.*, customers.name AS "customerName", games.name AS "gameName", games."categoryId", categories.name AS "categoryName"
                FROM rentals 
                JOIN customers
                ON rentals."customerId" = customers.id 
                JOIN games
                ON rentals."gameId" = games.id 
                JOIN categories
                ON games."categoryId" = categories.id
                LIMIT $1 OFFSET $2`,[limit? limit:null, offset? offset:0]
            );
        }
        let rentList = [];
        for(let i = 0; i < rentals.rows.length; i++){
            const {
                id,
                customerId,
                gameId,
                rentDate,
                daysRented,
                returnDate,
                originalPrice,
                delayFee,
                customerName,
                gameName,
                categoryId,
                categoryName                
            } = rentals.rows[i]
            const data = {
                id: id,
                customerId: customerId,
                gameId: gameId,
                rentDate: dayjs(rentDate).format('YYYY-MM-DD'),
                daysRented: daysRented,
                returnDate: returnDate?dayjs(returnDate).format('YYYY-MM-DD'): returnDate,
                originalPrice: originalPrice,
                delayFee: delayFee,
                customer: {
                    id: customerId,
                    name: customerName
                },
                game: {
                    id: gameId,
                    name: gameName,
                    categoryId: categoryId,
                    categoryName: categoryName
                }
            }
            rentList.push(data);
        }
        res.send(rentList);
    }catch (e){
        console.log(e);
        res.sendStatus(400);
    };
});

//adiciona um novo aluguel
app.post("/rentals", async (req,res) => {
    const { customerId, gameId, daysRented } = req.body;
    const userSchema = joi.object({
        customerId: joi.number().min(1).required(),
        gameId: joi.number().min(1).required(),
        daysRented: joi.number().min(1).required(),
    });
    const { error, value } = userSchema.validate({
        customerId: customerId, 
        gameId: gameId,
        daysRented: daysRented,
    });
    if(error){
        res.sendStatus(400);
    }
    const rentDate = dayjs().format('YYYY-MM-DD');
    try{
        const game = await connection.query(`
            SELECT games.*, customers.id AS "customerId" 
            FROM games JOIN customers
            ON games.id = $1 AND customers.id = $2
            `,[gameId, customerId]);
        const stockValidation = game.rows[0].stockTotal < 1;
        const existGameValidation = !game.rows[0].id;
        const customerValidation = !game.rows[0].customerId;

        if(stockValidation || existGameValidation || customerValidation){
            sendStatus(400);
            return;
        }

        const returnDate = null;
        const delayFee = null
        const originalPrice = daysRented * game.rows[0].pricePerDay;
        await connection.query('INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") VALUES ($1, $2, $3, $4, $5, $6, $7)',[customerId, gameId, rentDate, daysRented, returnDate, originalPrice, delayFee]);
        res.sendStatus(201);
    }catch (e){
        console.log(e);
        res.sendStatus(400);
    };
});

//finaliza um aluguel
app.post("/rentals/:id/return", async (req,res) => {
    const { id } = req.params;
    
    const userSchema = joi.object({
        id: joi.number().min(1)
    });
    const { error, value } = userSchema.validate({
        id: id
    });
    if(error){
        res.sendStatus(400);
        return;
    }
    
    try{
        const validation = await connection.query('SELECT * FROM rentals WHERE id = $1',[id]);
        if(!validation.rows[0]){
            res.sendStatus(404);
            return;
        }
        else if(validation.rows[0].returnDate){
            res.sendStatus(400);
            return;
        }
        const rentDate = dayjs(validation.rows[0].rentDate);
        const today = dayjs();
        const difference = today.diff(rentDate, 'day');
        const delayFee =  difference > validation.rows[0].daysRented? (difference-validation.rows[0].daysRented) * validation.rows[0].originalPrice: null;
        await connection.query('UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE id = $3',[dayjs().format('YYYY-MM-DD'), delayFee ,id]);
        res.sendStatus(200);
    } catch{
        res.sendStatus(400);
    };
});

//deleta um aluguel
app.delete("/rentals/:id", async (req,res) => {
    const { id } = req.params;
    
    const userSchema = joi.object({
        id: joi.number().min(1)
    });
    const { error, value } = userSchema.validate({
        id: id
    });
    if(error){
        res.sendStatus(400);
        return;
    }
    
    try{
        const validation = await connection.query('SELECT * FROM rentals WHERE id = $1',[id]);
        if(!validation.rows[0]){
            res.sendStatus(404);
            return;
        }
        else if(validation.rows[0].returnDate){
            res.sendStatus(400);
            return;
        }
        await connection.query('DELETE FROM rentals WHERE id = $1',[id]);
        res.sendStatus(200);
    } catch{
        res.sendStatus(400);
    };
});
//fim da rota rentals

app.listen(4000, () =>{
    console.log("Porta 4000!");
});