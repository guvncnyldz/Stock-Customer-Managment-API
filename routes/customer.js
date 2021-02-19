const express = require('express');
const base64 = require('../utils/base64Util')
const router = express.Router();

router.post('/add', (req, res) => {
    const {company_id, filters, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, device_id, installation_date, maintenance_date, warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo, log_profile_id} = req.body

    addCustomer(res, filters, company_id, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, device_id, installation_date, maintenance_date, warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo, log_profile_id)
})

router.post('/addWithDevice', (req, res) => {
    const {company_id, filters, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, installation_date, maintenance_date, warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo, model, is_system_open, warranty_period, log_profile_id} = req.body
    const sql = 'INSERT into device (model,is_system_open,warranty_period,quantity) values (?,?,?,1)'

    try {

        db.query(sql, [model, is_system_open, warranty_period], (err, result) => {
            addCustomer(res, filters, company_id, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, result.insertId, installation_date, maintenance_date, warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo, log_profile_id)
        })
    } catch (error) {
        res.json({
            code: 500,
            message: error.toString()
        })
        throw error
    }
})

function addCustomer(res, filters, company_id, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, device_id, installation_date, maintenance_date, warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo, profile_id) {
    const sql = 'call createCustomer(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'

    let photoPath = ""

    try {

        if (photo != "") {
            photoPath = '/images/customer/' + name_surname + Date.now() + '.png';
            base64.decodeBase64(photo, photoPath)
        }

        db.query(sql, [company_id, profile_id, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, device_id, installation_date, maintenance_date, warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photoPath], (err, result) => {
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

    const sql = 'select c.*,ap.name_surname as adder_profile_name_surname, coalesce(cp.totalPay,0) as total_pay, coalesce(cp.is_partial,0) as is_partial, coalesce(TIMESTAMPDIFF(second,now(),ppd.payment_date),0) as next_pay_date,coalesce(TIMESTAMPDIFF(second,now(),m.maintenance_date),0) as next_maintenance_date from customer c\n' +
        '        left join (select ppd.payment_id, ppd.payment_date,ppd.is_paid, ppd.customer_id from payment_partial_detail ppd group by ppd.payment_date order by ppd.payment_date asc ) ppd on ppd.customer_id = c.id and ppd.is_paid = 0\n' +
        '        left join (select m.maintenance_date,m.customer_id from maintenance m group by m.maintenanced_date order by m.maintenanced_date desc ) m on m.customer_id = c.id\n' +
        '        left join (select coalesce(sum(cp.total_pay-(cp.first_paid+cp.total_paid)),0) as totalPay, cp.customer_id,cp.is_partial from customer_payment cp group by customer_id) cp on c.id = cp.customer_id\n' +
        '        left join (select p.name_surname, p.id from profile p) ap on ap.id = c.adder_profile_id\n' +
        '        where c.is_visible = 1 and c.company_id = 114\n' +
        '        group by c.id'

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

    const sql = `select JSON_OBJECT(
               'id', c.id,
               'customer_name', c.name_surname,
               'province', c.province,
               'district', c.district,
               'neighborhood', c.neighborhood,
               'street', c.street,
               'apartment', c.apartment,
               'address_description', c.address_description,
               'latitude', c.latitude,
               'longitude', c.longitude,
               'adder_profile_id', ap.id,
               'adder_profile_name', ap.name_surname,
               'devices', (select JSON_ARRAYAGG(JSON_OBJECT(
                'customer_device_id', cd.id,
                'installation_date', cd.installation_date,
                'warranty_start_date', cd.warranty_start_date,
                'warranty_end_date', cd.warranty_end_date,
                'device_id', d.id,
                'device_model', d.model,
                'device_photo_path', d.photo_path,
                'device_filters', (select JSON_ARRAYAGG(JSON_OBJECT('filter_id', f.id, 'device_filter_id', df.id,
                                                                    'filter_name', f.name, 'filter_description',
                                                                    f.description))
                                   from customer_device_filter df
                                            left join filter f on df.filter_id = f.id
                                   where df.customer_device_id = cd.id),
                'maintenance', (select JSON_ARRAYAGG(JSON_OBJECT('maintenance_id', m.id,
                                                                'maintenance_date', maintenance_date,
                                                                'maintenance_operation',
                                                                 m.operation, 'maintenance_description',
                                                                 m.description
                                                                 ,'maintenanced_date',maintenanced_date))
                                from maintenance m
                                where m.customer_device_id = cd.id
                                order by m.create_date, cd.installation_date desc)
            )) as maintenances
                           from customer_device cd
                                    inner join device d on cd.device_id = d.id
                           where cd.customer_id = c.id),
               'payments', (select JSON_ARRAYAGG(
                                           JSON_OBJECT('id', cp.id, 'name', cp.name, 'description', cp.description,
                                                       'total_pay', cp.total_pay, 'first_pay', cp.first_paid,
                                                       'total_paid', cp.total_paid, 'is_partial', cp.is_partial,
                                                       'partial_start_date', partial_start_date, 'partial_count',
                                                       partial_count))
                            from customer_payment cp
                            where cp.customer_id = c.id)
           ) as customer
from customer c
         left join profile ap on c.adder_profile_id = ap.id
where c.id = ?  and c.is_visible = true`

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

module.exports = router