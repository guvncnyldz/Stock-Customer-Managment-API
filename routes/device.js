const express = require('express');
const base64 = require('../utils/base64Util')
const router = express.Router();

router.post('/add', (req, res) => {
    const {company_id, model, description, warranty_period, quantity, purchase_price, sale_price, photo, filters, is_system_open, log_profile_id} = req.body;
    let sql = 'INSERT into device (company_id,model,description,is_system_open,warranty_period,quantity,purchase_price,sale_price,photo_path) values (?,?,?,?,?,?,?,?,?)'

    let photoPath = ""

    try {

        if (photo != "") {
            photoPath = '/images/device/' + model + Date.now() + '.png';
            base64.decodeBase64(photo, photoPath)
        }

        db.query(sql, [company_id, model, description, is_system_open, warranty_period, quantity, purchase_price, sale_price, photoPath], (err, result) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

            }

            if (filters != "") {
                sql = 'INSERT into device_filter (device_id,filter_id) values ?'

                filters1 = filters.replace(/"/g, '');
                let finalFilters = JSON.parse(filters1)

                let values = []

                finalFilters.forEach(filter => {
                    let array = []
                    array.push(result.insertId);
                    array.push(filter);

                    values.push(array)
                })

                console.log(values)

                db.query(sql, [values]);
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

router.post('/addFilter', (req, res) => {
    const {device_id, filters} = req.body;
    const sql = 'INSERT into device_filter (device_id,filter_id) values ?'


    try {
        filters1 = filters.replace(/"/g, '');
        let finalFilters = JSON.parse(filters1)

        let values = []

        finalFilters.forEach(filter => {
            let array = []
            array.push(device_id);
            array.push(filter);

            values.push(array)
        })

        console.log(values)

        db.query(sql, [values],(err,result) =>
        {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err
            }

            res.json({
                code: 200,
                message: "Filtre eklendi"
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

router.delete('/filter', (req, res) => {
    const {log_profile_id, log_company_id} = req.body
    const {filter_id} = req.query

    let sql = 'delete from device_filter where id = ?'

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

router.delete('/', (req, res) => {
    const {log_profile_id, log_company_id} = req.body
    const {device_id} = req.query

    let sql = 'update device set is_visible=false where id = ?'

    try {
        db.query(sql, [device_id], (err, results) => {
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
                    message: 'Cihaz silindi',
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
})

router.put('/', ((req, res) => {
    let {model, description, warranty_period, quantity, purchase_price, sale_price, photo, is_system_open, log_profile_id, log_company_id} = req.body
    const {device_id} = req.query

    if (!model)
        model = ""
    if (!warranty_period)
        warranty_period = ""
    if (!description)
        description = ""
    if (!quantity)
        quantity = ""
    if (!purchase_price)
        purchase_price = ""
    if (!sale_price)
        sale_price = ""
    if (!is_system_open)
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
        description = CASE WHEN '${description}' IS NULL THEN description else '${description}' END,
        warranty_period = CASE WHEN '${warranty_period}' = '' or '${warranty_period}' IS NULL THEN warranty_period else '${warranty_period}' END,
        quantity = CASE WHEN '${quantity}' = '' or '${quantity}' IS NULL THEN quantity else '${quantity}' END,
        purchase_price = CASE WHEN '${purchase_price}' = '' or '${purchase_price}' IS NULL THEN purchase_price else '${purchase_price}' END,
        sale_price = CASE WHEN '${sale_price}' = '' or '${sale_price}' IS NULL THEN sale_price else '${sale_price}' END,
        is_system_open = CASE WHEN '${is_system_open}' = '' or '${is_system_open}' IS NULL THEN is_system_open else '${is_system_open}' END,
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