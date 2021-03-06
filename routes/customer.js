const express = require('express');
const base64 = require('../utils/base64Util')
const db_log = require('../db_logs/util')
const router = express.Router();

router.post('/add', (req, res) => {
    const {company_id, filters, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, device_id, installation_date, maintenance_date, maintenance_operation, maintenance_description, warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo, log_profile_id} = req.body
    addCustomer(res, filters, company_id, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, device_id, installation_date, maintenance_date, maintenance_operation, maintenance_description, warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo, log_profile_id)
})

router.post('/addWithDevice', (req, res) => {
    const {company_id, filters, name_surname, tel_no, province, district, neighborhood, street, apartment, address_description, latitude, longitude, installation_date, maintenance_date, maintenance_operation, maintenance_description, warranty_start_date, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, photo, model, is_system_open, warranty_period, log_profile_id,purchase_price} = req.body
    const sql = 'INSERT into device (company_id,model,is_system_open,warranty_period,quantity) values (?,?,?,?,1)'

    try {

        db.query(sql, [company_id, model, is_system_open, warranty_period], (err, result) => {
            db_log.add_stock_log(log_profile_id,company_id,1,result.insertId,1,1,purchase_price);
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

    let photoPath = ""

    try {

        if (photo != null && photo != "") {
            photoPath = '/images/customer/' + name_surname.replace(/ /g, '-') + Date.now() + '.png';
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

            db_log.add_customer_log(profile_id,company_id,customer.id,1);

            let sql = 'INSERT into maintenance_filter (maintenance_id,filter_id,operation_id) values ?'

            if (filters != "") {

                let values = []

                values = createFiltersArray(filters, customer.devices[0].maintenance[0].maintenance_id, 1, values)
                addDeviceFilter(customer.devices[0].customer_device_id, filters, (err) => {
                }, () => {
                    db.query(sql, [values], (err, result) => {


                        sql = 'select GetCustomer(?) as customer'

                        db.query(sql, customer.id, (err, result) => {
                            if (err) {
                                res.json({
                                    code: 500,
                                    message: err
                                })

                                throw err

                            }

                            finalCustomer = JSON.parse(result[0].customer)
                            res.json({
                                code: 200,
                                message: 'M????teri eklendi',
                                data: finalCustomer
                            })
                        });
                    });

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
}

function createFiltersArray(filters, id, operation_id, values) {
    filters1 = filters.replace(/"/g, '');
    let finalFilters = JSON.parse(filters1)

    finalFilters.forEach(filter => {
        let array = []
        array.push(id);
        array.push(filter);
        array.push(operation_id);

        values.push(array)
    })

    return values
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
                    message: 'M????teri listesi al??nd??',
                    data: result
                })
            } else {
                res.json({
                    code: 404,
                    message: 'M????teri bulunamad??'
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

            if (result[0].customer) {

                res.json({
                    code: 200,
                    message: 'M????teri al??nd??',
                    data: JSON.parse(result[0].customer)
                })
            } else {
                res.json({
                    code: 404,
                    message: 'M????teri bulunamad??'
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
    const {log_profile_id, log_company_id} = req.body

    try {
        addDeviceFilter(customer_device_id, filters, (err) => {
                res.json({
                    code: 500,
                    message: err
                })

                throw err
            },
            () => {
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

function addDeviceFilter(customer_device_id, filters, error, success) {
    const sql = 'INSERT into customer_device_filter (customer_device_id,filter_id) values ?'

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
            error(err)
        }

        success()
    })
}

router.delete('/deviceFilter', (req, res) => {
    const {log_profile_id, log_company_id, filters} = req.body

    try {
        deleteDeviceFilter(filters, (err) => {
            res.json({
                code: 500,
                message: err
            })

            throw err
        }, (results) => {
            if (results.affectedRows > 0) {
                res.json({
                    code: 200,
                    message: 'Filtre silindi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Filtre bulunamad??',
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

function deleteDeviceFilter(filters, error, success) {
    let sql = 'delete from customer_device_filter where id in (?)'

    filters1 = filters.replace(/"/g, '');
    let finalFilters = JSON.parse(filters1)

    if(!finalFilters.length)
        return;

    db.query(sql, [finalFilters], (err, results) => {
        if (err) {
            error(err)

            throw err
        }

        success(results)
    })
}

router.delete('/', (req, res) => {
    const {log_profile_id, log_company_id} = req.body
    const {customer_id} = req.query

    let sql = 'update customer set is_visible=false where id = ? and is_visible = 1'

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
                sql = 'update customer_payment\n' +
                    'left join payment_cash_detail pcd on customer_payment.id = pcd.customer_payment_id\n' +
                    'left join payment_partial_detail ppd on customer_payment.id = ppd.payment_id\n' +
                    '    set customer_payment.is_visible = 0, pcd.is_visible = 0, ppd.is_visible = 0\n' +
                    'where\n' +
                    '    customer_payment.customer_id = ?'
                db.query(sql,[customer_id],(err,results) => {
                    if (results.affectedRows > 0) {
                        sql = 'update maintenance set is_visible = 0 where customer_id = ?'
                        db.query(sql,[customer_id],(err,results) => {
                            if (results.affectedRows > 0) {
                                db_log.add_customer_log(log_profile_id,log_company_id,customer_id,3);
                                res.json({
                                    code: 200,
                                    message: 'M????teri silindi',
                                })
                            }
                        })
                    }
                })
            } else {
                res.json({
                    code: 404,
                    message: 'M????teri bulunamad??',
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
            photoPath = '/images/customer/' + name_surname.replace(/ /g, '-') + Date.now() + '.png';
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
                db_log.add_customer_log(log_profile_id,log_company_id,customer_id,2);
                res.json({
                    code: 200,
                    message: 'M????teri g??ncellendi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'M????teri bulunamad??',
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

        photoPath = '/images/customerDevice/' + customer_device_id.replace(/ /g, '-') + Date.now() + '.png';
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
                message: 'Foto??raf eklendi',
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
                    message: 'Foto??raf silindi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Foto??raf bulunamad??',
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
                    message: 'Foto??raf al??nd??',
                    data: result
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Foto??raf bulunamad??',
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

module.exports = {router, addDeviceFilter, deleteDeviceFilter}