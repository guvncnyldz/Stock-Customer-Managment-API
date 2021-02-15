const express = require('express');
const base64 = require('../utils/base64Util')
const router = express.Router();

router.post('/add', (req, res) => {
    const {company_id, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, device_id, installation_date, maintenance_date, warranty_start_date,payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo,log_profile_id} = req.body

    addCustomer(res, company_id, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, device_id, installation_date, maintenance_date,warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo,log_profile_id)
})

router.post('/addWithDevice', (req, res) => {
    const {company_id, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, installation_date, maintenance_date,warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo, model,is_system_open,warranty_period,log_profile_id} = req.body
    const sql = 'INSERT into device (model,is_system_open,warranty_period,quantity) values (?,?,?,1)'

    try {

        db.query(sql, [model,is_system_open,warranty_period], (err, result) => {
            addCustomer(res, company_id, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, result.insertId, installation_date, maintenance_date,warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo,log_profile_id)
        })
    } catch (error) {
        res.json({
            code: 500,
            message: error.toString()
        })
        throw error
    }
})

function addCustomer(res, company_id, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, device_id, installation_date, maintenance_date, warranty_start_date,payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo,profile_id) {
    const sql = 'call createCustomer(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'

    let photoPath = ""

    try {

        if (photo != "") {
            photoPath = '/images/customer/' + name_surname + Date.now() + '.png';
            base64.decodeBase64(photo, photoPath)
        }

        db.query(sql, [company_id, profile_id,name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, device_id, installation_date, maintenance_date, warranty_start_date,payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photoPath], (err, result) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err

            }
            console.log(JSON.parse(result[0][0].customer))

            res.json({
                code: 200,
                message: 'Müşteri eklendi',
                data: JSON.parse(result[0][0].customer)
            })
        })
    } catch (error) {
        res.json({
            code: 500,
            message: error.toString()
        })
        throw error
    }
}

module.exports = router