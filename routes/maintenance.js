const express = require('express');
const router = express.Router();

router.post('/do', (req, res) => {
    const {customer_device_id, operation, description, maintenance_date, customer_id, filters, log_profile_id, log_company_id} = req.body
    let sql = "INSERT INTO maintenance(customer_id,operation,description,customer_device_id, maintenance_date, maintenanced_date) VALUES (?,?,?,?, COALESCE(?, '0000/00/00'), current_timestamp)"

    try {
        db.query(sql, [customer_id, operation, description, customer_device_id, maintenance_date], (err, result) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })
            }

            let sql = 'INSERT into maintenance_filter (maintenance_id,filter_id) values ?'

            if (filters != "") {
                filters1 = filters.replace(/"/g, '');
                let finalFilters = JSON.parse(filters1)

                let values = []

                finalFilters.forEach(filter => {
                    let array = []
                    array.push(result.insertId);
                    array.push(filter);

                    values.push(array)
                })

                db.query(sql, [values]);
            }

            res.json({
                code: 200,
                message: 'Bakım yapıldı',
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

router.get('/detail', (req, res) => {
    const {maintenance_id, log_profile_id, log_company_id} = req.query
    const sql = 'select JSON_ARRAYAGG(JSON_OBJECT(\n' +
        '        \'maintenance_date\', m.maintenance_date,\n' +
        '        \'operation\', m.operation,\n' +
        '        \'description\', m.description,\n' +
        '        \'maintenanced_date\', m.maintenanced_date,\n' +
        '        \'create_date\', m.create_date,\n' +
        '        \'filters\', (select JSON_ARRAYAGG(JSON_OBJECT(\'maintenance_filter_id\', mf.id,\n' +
        '                                                     \'filter_id\', f.id,\n' +
        '                                                     \'name\', f.name,\n' +
        '                                                     \'description\', f.description)) filters\n' +
        '                    from maintenance_filter mf\n' +
        '                             left join filter f on mf.filter_id = f.id\n' +
        '                    where mf.maintenance_id = m.id))) as maintenance\n' +
        'from maintenance m\n' +
        'where m.id = ?'

    try {
        db.query(sql, [maintenance_id], (err, result) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })
            }
            console.log(result)
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
    const sql = 'select JSON_ARRAYAGG(JSON_OBJECT(\'id\', m.id, \'customer_device_id\', m.customer_device_id, \'maintenance_date\',\n' +
        '                                 m.maintenance_date, \'maintenanced_date\', m.maintenanced_date, \'operation\', m.operation,\n' +
        '                                 \'description\', m.description, \'create_date\', m.create_date,\n' +
        '                                 \'filters\', (select JSON_ARRAYAGG(\n' +
        '                                                            JSON_OBJECT(\'maintenance_filter_id\', mf.id, \'filter_id\',\n' +
        '                                                                        f.id, \'name\', f.name, \'description\',\n' +
        '                                                                        f.description))\n' +
        '                                             from maintenance_filter mf\n' +
        '                                                      left join filter f on mf.filter_id = f.id\n' +
        '                                             where mf.maintenance_id = m.id))) as maintenance\n' +
        'from maintenance m\n' +
        'where customer_id = ?\n' +
        '  and is_visible = true'

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
    const sql = 'select JSON_ARRAYAGG(JSON_OBJECT(\'id\', m.id, \'customer_device_id\', m.customer_device_id, \'maintenance_date\',\n' +
        '                                 m.maintenance_date, \'maintenanced_date\', m.maintenanced_date, \'operation\', m.operation,\n' +
        '                                 \'description\', m.description, \'create_date\', m.create_date,\n' +
        '                                 \'filters\', (select JSON_ARRAYAGG(\n' +
        '                                                            JSON_OBJECT(\'maintenance_filter_id\', mf.id, \'filter_id\',\n' +
        '                                                                        f.id, \'name\', f.name, \'description\',\n' +
        '                                                                        f.description))\n' +
        '                                             from maintenance_filter mf\n' +
        '                                                      left join filter f on mf.filter_id = f.id\n' +
        '                                             where mf.maintenance_id = m.id))) as maintenance\n' +
        'from maintenance m\n' +
        'where customer_device_id = ?\n' +
        '  and is_visible = true'

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

module.exports = router