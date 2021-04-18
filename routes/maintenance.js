const customer = require('./customer')

const express = require('express');
const router = express.Router();


router.post('/do', (req, res) => {
    const {customer_device_id, operation, description, maintenance_date, customer_id, maintained_filters, new_filters, old_filters,other_filters, log_profile_id, log_company_id} = req.body
    let sql = "INSERT INTO maintenance(customer_id,profile_id,operation,description,customer_device_id, maintenance_date, maintenanced_date) VALUES (?,?,?,?,?, COALESCE(?, '0000/00/00'), current_timestamp)"

    try {
        db.query(sql, [customer_id,log_profile_id, operation, description, customer_device_id, maintenance_date], (err, result) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                return
            }

            sql = "select filter_id, id from customer_device_filter where customer_device_id = ?"

            db.query(sql,[customer_device_id],(err,currentFilters) =>
            {
                if (err) {
                    res.json({
                        code: 500,
                        message: err
                    })

                    return
                }

                let values = []

                if (maintained_filters != "" || maintained_filters != null) {
                    values = createFiltersArray(maintained_filters, result.insertId, 2, values)
                }

                if (other_filters != "" || other_filters != null) {
                    values = createFiltersArray(other_filters, result.insertId, -1, values)
                }

                if (old_filters != "" || old_filters != null) {
                    values = createFiltersArray(old_filters, result.insertId, 0, values)
                    customer.deleteDeviceFilter(old_filters, (err) => {
                    }, (result) => {
                    })
                }
                let stringValues = JSON.stringify(values)
                currentFilters.forEach(currentFilter =>
                {
                    var re = new RegExp(currentFilter.id, 'g');
                    stringValues = stringValues.replace(re,currentFilter.filter_id)
                })
                values = JSON.parse(stringValues)

                if (new_filters != "" || new_filters != null) {
                    values = createFiltersArray(new_filters, result.insertId, 1, values)
                    customer.addDeviceFilter(customer_device_id, new_filters, (err) => {
                    }, () => {
                    })
                }

                sql = 'INSERT into maintenance_filter (maintenance_id,filter_id,operation_id) values ?'

                db.query(sql, [values]);

                res.json({
                    code: 200,
                    message: 'Bakım yapıldı',
                })
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

router.get('/detail', (req, res) => {
    const {maintenance_id, log_profile_id, log_company_id} = req.query
    const sql = `select JSON_ARRAYAGG(JSON_OBJECT(
        'maintenance_date', m.maintenance_date,
        'operation', m.operation,
        'profile_id', m.profile_id,
        'profile_name', p.name_surname,
        'description', m.description,
        'maintenanced_date', m.maintenanced_date,
        'create_date', m.create_date,
        'filters', (select JSON_ARRAYAGG(JSON_OBJECT('maintenance_filter_id', mf.id,
                                                     'operation_id', mf.operation_id,
                                                     'filter_id', mf.filter_id,
                                                     'name', f.name,
                                                     'description', f.description)) filters
                    from maintenance_filter mf
                             left join filter f on mf.filter_id = f.id
                    where mf.maintenance_id = m.id))) as maintenance
from maintenance m
left join profile p on m.profile_id = p.id
where m.id = 49`

    try {
        db.query(sql, [maintenance_id], (err, result) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })
            }

            if (result.length > 0) {
                res.json({
                    code: 200,
                    message: 'Bakım alındı',
                    data: JSON.parse(result[0].maintenance)
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Bakım bulunamadı'
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

router.put('/', (req, res) => {
    let {operation, description, maintenance_date, maintenanced_date, log_profile_id, log_company_id} = req.body
    const {maintenance_id} = req.query

    if (!operation)
        operation = ""
    if (!maintenance_date)
        maintenance_date = ""
    if (!description)
        description = ""
    if (!maintenanced_date)
        maintenanced_date = ""

    try {

        let sql = `update maintenance set 
        operation = CASE WHEN '${operation}' = '' or '${operation}' IS NULL THEN operation else '${operation}' END,
        description = CASE WHEN  '${description}' IS NULL THEN description else '${description}' END,
        maintenance_date = CASE WHEN '${maintenance_date}' = '' or  '${maintenance_date}' IS NULL THEN maintenance_date else '${maintenance_date}' END,
        maintenanced_date = CASE WHEN '${maintenanced_date}' = '' or '${maintenanced_date}' IS NULL THEN maintenanced_date else '${maintenanced_date}' END
        where id = ?`

        db.query(sql, maintenance_id, (err, result) => {
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
                    message: 'Bakım güncellendi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Bakım bulunamadı',
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

router.post('/addFilter', (req, res) => {
    const {maintenance_id, filters} = req.body;
    const sql = 'INSERT into maintenance_filter (maintenance_id,filter_id) values ?'


    try {
        filters1 = filters.replace(/"/g, '');
        let finalFilters = JSON.parse(filters1)

        let values = []

        finalFilters.forEach(filter => {
            let array = []
            array.push(maintenance_id);
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

router.delete('/filter', (req, res) => {
    const {log_profile_id, log_company_id} = req.body
    const {maintenance_filter_id} = req.query

    let sql = 'delete from maintenance_filter where id = ?'

    try {
        db.query(sql, [maintenance_filter_id], (err, results) => {
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

router.get('/byCustomer', (req, res) => {
    const {customer_id} = req.query
    const sql = `select JSON_ARRAYAGG(JSON_OBJECT('id', m.id, 'profile_name', p.name_surname,'profile_id',p.id,'customer_device_id', m.customer_device_id, 'maintenance_date',
                                 m.maintenance_date, 'maintenanced_date', m.maintenanced_date, 'operation', m.operation,
                                 'description', m.description, 'create_date', m.create_date,
                                 'filters', (select JSON_ARRAYAGG(
                                                            JSON_OBJECT('maintenance_filter_id',mf.id,'operation_id', mf.operation_id,'operation', fo.operation, 'filter_id',
                                                                        f.id, 'name', f.name, 'description',
                                                                        f.description))
                                             from maintenance_filter mf
                                                      left join filter f on mf.filter_id = f.id
                                                      left join filter_operation fo on mf.operation_id = fo.id
                                             where mf.maintenance_id = m.id))) as maintenance
from maintenance m
left join profile p on m.profile_id = p.id
where customer_id = ?
  and m.is_visible = true`

    try {
        db.query(sql, [customer_id], (err, results) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err
            }

            if (results.length > 0) {

                res.json({
                    code: 200,
                    message: 'Bakımlar alındı',
                    data: JSON.parse(results[0].maintenance)
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Bakım bulunamadı',
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

router.get('/byDevice', (req, res) => {
    const {customer_device_id} = req.query
    const sql = `select JSON_ARRAYAGG(JSON_OBJECT('id', m.id, 'profile_name', p.name_surname,'profile_id',p.id,'customer_device_id', m.customer_device_id, 'maintenance_date',
                                 m.maintenance_date, 'maintenanced_date', m.maintenanced_date, 'operation', m.operation,
                                 'description', m.description, 'create_date', m.create_date,
                                 'filters', (select JSON_ARRAYAGG(
                                                            JSON_OBJECT('maintenance_filter_id', mf.id,'operation_id', mf.operation_id,'operation', fo.operation, 'filter_id',
                                                                        f.id, 'name', f.name, 'description',
                                                                        f.description))
                                             from maintenance_filter mf
                                                      left join filter f on mf.filter_id = f.id
                                                      left join filter_operation fo on mf.operation_id = fo.id
                                             where mf.maintenance_id = m.id))) as maintenance
from maintenance m
left join profile p on m.profile_id = p.id
where customer_device_id = ?
  and m.is_visible = true`

    try {
        db.query(sql, [customer_device_id], (err, results) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err
            }

            if (results.length > 0) {

                res.json({
                    code: 200,
                    message: 'Bakımlar alındı',
                    data: JSON.parse(results[0].maintenance)
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Bakım bulunamadı',
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

router.get('/filterOperations', (req, res) => {
    const sql = `select * from filter_operation`

    try {
        db.query(sql, (err, results) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err
            }

            res.json({
                code: 200,
                message: 'Filtre operasyonları alındı',
                data: results
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
module.exports = router