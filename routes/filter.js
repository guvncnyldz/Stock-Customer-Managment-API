const express = require('express');
const router = express.Router();
const base64 = require('../utils/base64Util');

router.post('/add', (req, res) => {
    const {company_id, name, description, warranty_period, quantity, purchase_price, sale_price,photo,log_profile_id} = req.body;
    const sql = 'INSERT into filter (company_id,name,description,warranty_period,quantity,purchase_price,sale_price,photo_path) values (?,?,?,?,?,?,?,?)'

    let photoPath = ""

    try {

        if (photo != null && photo != "") {
            photoPath = '/images/filter/' + name + Date.now() + '.png';
            base64.decodeBase64(photo, photoPath)
        }

        db.query(sql, [company_id, name, description, warranty_period, quantity, purchase_price, sale_price,photoPath], (err) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err
            }

            res.json({
                code: 200,
                message: 'Filtre eklendi',
            })
        })
    } catch (error) {
        res.json({
            code: 500,
            message: error.toString()
        })
        throw error
    }
})

router.delete('/',(req,res) =>
{
    const {log_profile_id,log_company_id} = req.body
    const {filter_id} = req.query

    let sql = 'update filter set is_visible=false where id = ?'

    try {
        db.query(sql, [filter_id], (err, results) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err
            }

            if (results.affectedRows > 0) {
                res.json({
                    code: 200,
                    message: 'Filtre silindi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Filtre bulunamadı',
                })
            }

        })
    } catch (error) {
        res.json({
            code: 500,
            message: error.toString()
        })
        throw error
    }
})

router.put('/', ((req, res) => {
    let {name, description, warranty_period, quantity, purchase_price, sale_price,photo,log_profile_id,log_company_id} = req.body
    const {filter_id} = req.query

    if (!name)
        name = ""
    if (!description)
        description = ""
    if (!warranty_period)
        warranty_period = ""
    if (!quantity)
        quantity = ""
    if (!purchase_price)
        purchase_price = ""
    if (!sale_price)
        sale_price = ""
    if (!photo)
        photo = ""

    let photoPath = "";

    try {
        if (photo != null && photo != "") {
            photoPath = '/images/filter/' + name + Date.now() + '.png';
            base64.decodeBase64(photo, photoPath)
        }

        let sql = `update filter set 
        name = CASE WHEN '${name}' = '' or '${name}' IS NULL THEN name else '${name}' END,
        description = CASE WHEN '${description}' IS NULL THEN description else '${description}' END,
        warranty_period = CASE WHEN '${warranty_period}' = '' or '${warranty_period}' IS NULL THEN warranty_period else '${warranty_period}' END,
        quantity = CASE WHEN '${quantity}' = '' or '${quantity}' IS NULL THEN quantity else '${quantity}' END,
        purchase_price = CASE WHEN '${purchase_price}' = '' or '${purchase_price}' IS NULL THEN purchase_price else '${purchase_price}' END,
        sale_price = CASE WHEN '${sale_price}' = '' or '${sale_price}' IS NULL THEN sale_price else '${sale_price}' END,
        photo_path = CASE WHEN '${photoPath}' = '' or '${photoPath}' IS NULL THEN photo_path else '${photoPath}' END 
        where id = ?`

        db.query(sql, filter_id, (err, result) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err
            }

            if (result.affectedRows > 0) {
                res.json({
                    code: 200,
                    message: 'Filtre güncellendi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Filtre bulunamadı',
                })
            }
        })
    } catch (error) {
        res.json({
            code: 500,
            message: error.toString()
        })
        throw error
    }
}))

router.get('/', (req, res) => {
    const {company_id} = req.query
    const sql = 'select * from filter where is_visible = 1 and company_id = ?'

    try {
        db.query(sql, [company_id], (err, result) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err
            }

            if (result.length > 0) {
                res.json({
                    code: 200,
                    message: 'Filtre getirildi',
                    data: result

                })
            } else {
                res.json({
                    code: 404,
                    message: 'Filtre bulunamadı',
                })
            }
        })
    } catch (error) {
        res.json({
            code: 500,
            message: error.toString()
        })

        throw error
    }
})

module.exports = router