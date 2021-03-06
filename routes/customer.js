const express = require('express');
const base64 = require('../utils/base64Util')
const router = express.Router();

router.post('/add', (req, res) => {
    const {company_id, filters, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, device_id, installation_date, maintenance_date, maintenance_operation, maintenance_description, warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo, log_profile_id} = req.body
    console.log(maintenance_operation)
    addCustomer(res, filters, company_id, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, device_id, installation_date, maintenance_date, maintenance_operation, maintenance_description, warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo, log_profile_id)
})

router.post('/addWithDevice', (req, res) => {
    const {company_id, filters, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, installation_date, maintenance_date, maintenance_operation, maintenance_description, warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo, model, is_system_open, warranty_period, log_profile_id} = req.body
    const sql = 'INSERT into device (company_id,model,is_system_open,warranty_period,quantity) values (?,?,?,?,1)'

    try {

        db.query(sql, [company_id, model, is_system_open, warranty_period], (err, result) => {
            addCustomer(res, filters, company_id, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, result.insertId, installation_date, maintenance_date, maintenance_operation, maintenance_description, warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo, log_profile_id)
        })
    } catch (error) {
        res.json({
            code: 500,
            message: error.toString()
        })
        throw error
    }
})

function addCustomer(res, filters, company_id, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, device_id, installation_date, maintenance_date, maintenance_operation, maintenance_description, warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo, profile_id) {
    const sql = 'call createCustomer(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    console.log(maintenance_operation)

    let photoPath = ""

    try {

        if (photo != null && photo != "") {
            photoPath = '/images/customer/' + name_surname + Date.now() + '.png';
            base64.decodeBase64(photo, photoPath)
        }

        db.query(sql, [company_id, profile_id, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, device_id, installation_date, maintenance_date, maintenance_operation, maintenance_description, warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photoPath], (err, result) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err

            }
            customer = JSON.parse(result[0][0].customer)
            let sql = 'INSERT into customer_device_filter (customer_device_id,filter_id) values ?'

            if (filters != "") {

                filters1 = filters.replace(/"/g, '');
                let finalFilters = JSON.parse(filters1)

                let values = []

                finalFilters.forEach(filter => {
                    let array = []
                    array.push(customer.devices[0].customer_device_id);
                    array.push(filter);

                    values.push(array)
                })

                db.query(sql, [values]);
            }

            res.json({
                code: 200,
                message: 'Müşteri eklendi',
                data: customer
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

router.get('/all', (req, res) => {
    const {company_id} = req.query

    const sql = 'select c.*,\n' +
        '       ap.name_surname                                               as adder_profile_name_surname,\n' +
        '       coalesce(cp.totalPay, 0)                                      as total_pay,\n' +
        '       coalesce(cp.is_partial, 0)                                    as is_partial,\n' +
        '       coalesce(TIMESTAMPDIFF(second, now(), ppd.payment_date), 0)   as next_pay_date,\n' +
        '       coalesce(TIMESTAMPDIFF(second, now(), m.maintenance_date), 0) as next_maintenance_date\n' +
        'from customer c\n' +
        '         left join (select ppd.payment_id, ppd.payment_date, ppd.is_paid, ppd.customer_id\n' +
        '                    from payment_partial_detail ppd\n' +
        '                    group by ppd.id\n' +
        '                    order by ppd.payment_date asc ) ppd on ppd.customer_id = c.id and ppd.is_paid = 0\n' +
        '         left join (select m.maintenance_date, m.customer_id\n' +
        '                    from maintenance m\n' +
        '                    group by m.id\n' +
        '                    order by m.maintenanced_date asc ) m on m.customer_id = c.id\n' +
        '         left join (select coalesce(sum(cp.total_pay - (cp.first_paid + cp.total_paid)), 0) as totalPay,\n' +
        '                           cp.customer_id,\n' +
        '                           cp.is_partial\n' +
        '                    from customer_payment cp\n' +
        '                    group by customer_id) cp on c.id = cp.customer_id\n' +
        '         left join (select p.name_surname, p.id from profile p) ap on ap.id = c.adder_profile_id\n' +
        'where c.is_visible = 1\n' +
        '  and c.company_id = ?\n' +
        'group by c.id ORDER BY c.name_surname'

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
                    message: 'Müşteri listesi alındı',
                    data: result
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Müşteri bulunamadı'
                })
            }
        })
    } catch (e) {
        res.json({
            code: 500,
            message: e.toString()
        })
        throw e
    }
})

router.get('/', (req, res) => {
    const {customer_id} = req.query

    const sql = `select GetCustomer(?) as customer`

    try {
        db.query(sql, [customer_id], (err, result) => {
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
                    message: 'Müşteri alındı',
                    data: JSON.parse(result[0].customer)
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Müşteri bulunamadı'
                })
            }
        })
    } catch (e) {
        res.json({
            code: 500,
            message: e.toString()
        })
        throw e
    }
})

router.post('/addDeviceFilter', (req, res) => {
    const {customer_device_id, filters} = req.body;
    const sql = 'INSERT into customer_device_filter (customer_device_id,filter_id) values ?'


    try {
        filters1 = filters.replace(/"/g, '');
        let finalFilters = JSON.parse(filters1)

        let values = []

        finalFilters.forEach(filter => {
            let array = []
            array.push(customer_device_id);
            array.push(filter);

            values.push(array)
        })

        db.query(sql, [values], (err, result) => {
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

router.delete('/deviceFilter', (req, res) => {
    const {log_profile_id, log_company_id} = req.body
    const {customer_device_filter_id} = req.query

    let sql = 'delete from customer_device_filter where id = ?'

    try {
        db.query(sql, [customer_device_filter_id], (err, results) => {
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
    const {customer_id} = req.query

    let sql = 'update customer set is_visible=false where id = ?'

    try {
        db.query(sql, [customer_id], (err, results) => {
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
                    message: 'Müşteri silindi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Müşteri bulunamadı',
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
    let {name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, photo, log_profile_id, log_company_id} = req.body
    const {customer_id} = req.query

    if (!name_surname)
        name_surname = ""
    if (!tel_no)
        tel_no = ""
    if (!province)
        province = ""
    if (!district)
        district = ""
    if (!neighborhood)
        neighborhood = ""
    if (!street)
        street = ""
    if (!apartment)
        apartment = ""
    if (!address_description)
        address_description = ""
    if (!latitude)
        latitude = ""
    if (!longitude)
        longitude = ""

    let photoPath = "";

    try {

        if (photo != null && photo != "") {
            photoPath = '/images/customer/' + name_surname + Date.now() + '.png';
            base64.decodeBase64(photo, photoPath)
        }

        let sql = `update customer set 
        name_surname = CASE WHEN '${name_surname}' = '' or '${name_surname}' IS NULL THEN name_surname else '${name_surname}' END,
        tel_no = CASE WHEN '${tel_no}' = '' or '${tel_no}' IS NULL THEN tel_no else '${tel_no}' END,
        province = CASE WHEN '${province}' = '' or '${province}' IS NULL THEN province else '${province}' END,
        district = CASE WHEN '${district}' = '' or '${district}' IS NULL THEN district else '${district}' END,
        neighborhood = CASE WHEN '${neighborhood}' = '' or '${neighborhood}' IS NULL THEN neighborhood else '${neighborhood}' END,
        street = CASE WHEN '${street}' = '' or '${street}' IS NULL THEN street else '${street}' END, 
        apartment = CASE WHEN '${apartment}' = '' or '${apartment}' IS NULL THEN apartment else '${apartment}' END,
        address_description = CASE WHEN '${address_description}' = '' or '${address_description}' IS NULL THEN address_description else '${address_description}' END,
        latitude = CASE WHEN '${latitude}' = '' or '${latitude}' IS NULL THEN latitude else '${latitude}' END,
        longitude = CASE WHEN '${longitude}' = '' or '${longitude}' IS NULL THEN longitude else '${longitude}' END,
        photo_path = CASE WHEN '${photoPath}' = '' or '${photoPath}' IS NULL THEN photo_path else '${photoPath}' END
        where id = ?`

        db.query(sql, customer_id, (err, result) => {
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
                    message: 'Müşteri güncellendi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Müşteri bulunamadı',
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

router.post('/addDevicePhoto', (req, res) => {
    const {customer_device_id, photo, log_company_id, log_profile_id} = req.body;
    let sql = 'INSERT into customer_device_photo (photo_path,customer_device_id) values (?,?)'


    try {

        photoPath = '/images/customerDevice/' + customer_device_id + Date.now() + '.png';
        base64.decodeBase64(photo, photoPath)

        db.query(sql, [photoPath, customer_device_id], (err, result) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

            }

            res.json({
                code: 200,
                message: 'Fotoğraf eklendi',
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

router.delete('/devicePhoto', (req, res) => {
    const {log_company_id, log_profile_id} = req.body;
    const {customer_device_photo_id} = req.query;
    let sql = 'delete from customer_device_photo where id = ?'

    try {

        db.query(sql, [customer_device_photo_id], (err, result) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })
            }

            console.log(result)

            if (result.affectedRows > 0) {
                res.json({
                    code: 200,
                    message: 'Fotoğraf silindi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Fotoğraf bulunamadı',
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

router.get('/devicePhoto', (req, res) => {
    const {customer_device_id} = req.query;
    let sql = 'select * from customer_device_photo where customer_device_id = ?'

    try {

        db.query(sql, [customer_device_id], (err, result) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })
            }

            if (result.length > 0) {
                res.json({
                    code: 200,
                    message: 'Fotoğraf alındı',
                    data: result
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Fotoğraf bulunamadı',
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