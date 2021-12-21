const connection = require('../db-config.js');
import { ResultSetHeader } from 'mysql2';
import IAddress from '../interfaces/IAddress';
import Joi from 'joi';
import { NextFunction, Request, Response } from 'express';
import { ErrorHandler } from '../helpers/errors';

const validateAddress = (req: Request, res: Response, next: NextFunction) => {
  let required: Joi.PresenceMode = 'optional';
  if (req.method === 'POST') {
    required = 'required';
  }
  const errors = Joi.object({
    address1: Joi.string().max(255).presence(required),
    address2: Joi.string().max(255).presence(required),
    city: Joi.string().max(200).presence(required),
    postalCode: Joi.string().max(10).presence(required),
    idUser: Joi.number().positive().presence(required),
  }).validate(req.body, { abortEarly: false }).error;
  if (errors) {
    next(new ErrorHandler(422, errors.message));
  } else {
    next();
  }
};

const addressExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { idAddress } = req.params;
  const addressExists: IAddress = await getById(Number(idAddress));
  if (!addressExists) {
    next(new ErrorHandler(409, `This address does not exist`));
  } else {
    next();
  }
};

const getAllAddresses = () => {
  return connection
    .promise()
    .query('SELECT * FROM addresses')
    .then(([results]: Array<IAddress>) => results);
};

const getById = (idAddress: number) => {
  return connection
    .promise()
    .query('SELECT * FROM addresses WHERE id_address = ?', [idAddress])
    .then(([results]: Array<Array<IAddress>>) => results[0]);
};

const getByUser = (idUser: number) => {
  return connection
    .promise()
    .query('SELECT * FROM addresses WHERE id_user = ?', [idUser])
    .then(([results]: Array<IAddress>) => results);
};

const addAddress = (address: IAddress) => {
  return connection
    .promise()
    .query(
      'INSERT INTO address (address1, address2, postal_code, city, id_user ) VALUES (?, ?, ?, ?, ?)',
      [
        address.address1,
        address.address2,
        address.postal_code,
        address.city,
        address.id_user,
      ]
    )
    .then(([results]: Array<ResultSetHeader>) => results.insertId);
};

const updateAddress = (idAddress: number, address: IAddress) => {
  let sql: string = 'UPDATE addresses SET ';
  let sqlValues: Array<any> = [];
  let oneValue: boolean = false;

  if (address.address1) {
    sql += 'address1 = ? ';
    sqlValues.push(address.address1);
    oneValue = true;
  }
  if (address.address2) {
    sql += oneValue ? ', address2 = ? ' : ' address2 = ? ';
    sqlValues.push(address.address2);
    oneValue = true;
  }
  if (address.postal_code) {
    sql += oneValue ? ', postal_code = ? ' : ' postal_code = ? ';
    sqlValues.push(address.postal_code);
    oneValue = true;
  }
  if (address.city) {
    sql += oneValue ? ', city = ? ' : ' city = ? ';
    sqlValues.push(address.city);
    oneValue = true;
  }
  sql += ' WHERE id_address = ?';
  sqlValues.push(idAddress);

  return connection
    .promise()
    .query(sql, sqlValues)
    .then(([results]: Array<ResultSetHeader>) => results.affectedRows === 1);
};

const deleteAddress = async (idAddress: number) => {
  return connection
    .promise()
    .query('DELETE FROM addresses WHERE id_addresses = ?', [idAddress])
    .then(([results]: Array<ResultSetHeader>) => results.affectedRows === 1);
};

const deleteAddressByUser = async (idUser: number) => {
  return connection
    .promise()
    .query('DELETE FROM addresses WHERE id_user = ?', [idUser])
    .then(([results]: Array<ResultSetHeader>) => results.affectedRows > 1);
};

export {
  validateAddress,
  getAllAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getById,
  getByUser,
  deleteAddressByUser,
  addressExists,
};
