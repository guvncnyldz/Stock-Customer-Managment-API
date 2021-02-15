const express = require('express');
const base64 = require('../utils/base64Util')
const router = express.Router();

router.post('/add', (req, res) => {
    const {model, warranty_period, quantity, purchase_price, sale_price, photo,is_system_open} = req.body;
    const sql = 'INSERT into device (model,is_system_open,warranty_period,quantity,purchase_price,sale_price,photo_path) values (?,?,?,?,?,?,?)'

    let photoPath = ""

    try {

        if (photo != "") {
            photoPath = '/images/device/' + model + Date.now() + '.png';
            base64.decodeBase64(photo, photoPath)
        }

        db.query(sql, [model, is_system_open,warranty_period, quantity, purchase_price, sale_price, photoPath], (err) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err
            }

            res.json({
                code: 200,
                message: 'Cihaz eklendi',
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

router.put('/info', ((req, res) => {
    let {model, warranty_period, quantity, purchase_price, sale_price, photo,is_system_open} = req.body
    const {device_id} = req.query

    if (!model)
        model = ""
    if (!warranty_period)
        warranty_period = ""
    if (!quantity)
        quantity = ""
    if (!purchase_price)
        purchase_price = ""
    if(!sale_price)
        sale_price = ""
    if(!is_system_open)
        is_system_open = ""
    if (!photo)
        photo = ""

    let photoPath = "";

    try {
        if (photo) {
            photoPath = '/images/device/' + model + Date.now() + '.png';
            base64.decodeBase64(photo, photoPath)
        }

        let sql = `update device set 
        model = CASE WHEN '${model}' = '' or '${model}' IS NULL THEN model else '${model}' END,
        warranty_period = CASE WHEN '${warranty_period}' = '' or '${warranty_period}' IS NULL THEN warranty_period else '${warranty_period}' END,
        quantity = CASE WHEN '${quantity}' = '' or '${quantity}' IS NULL THEN quantity else '${quantity}' END,
        purchase_price = CASE WHEN '${purchase_price}' = '' or '${purchase_price}' IS NULL THEN purchase_price else '${purchase_price}' END,
        sale_price = CASE WHEN '${sale_price}' = '' or '${sale_price}' IS NULL THEN sale_price else '${sale_price}' END 
        is_system_open = CASE WHEN '${is_system_open}' = '' or '${is_system_open}' IS NULL THEN is_system_open else '${is_system_open}' END 
        photo_path = CASE WHEN '${photoPath}' = '' or '${photoPath}' IS NULL THEN photo_path else '${photoPath}' END 
        where id = ?`

        db.query(sql, device_id, (err, result) => {
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
                    message: 'Cihaz güncellendi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Cihaz bulunamadı',
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

module.exports = router