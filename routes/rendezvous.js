const express = require('express');
const router = express.Router();

router.post('/add', (req, res) => {
    const {company_id, profile_id, customer_id,name, description, date, log_company_id} = req.body
    const sql = 'insert into rendezvous (company_id,profile_id,customer_id,name,description,date) values (?,?,?,?,?,?)'

    try {
        db.query(sql, [company_id,profile_id,customer_id, name, description, date], (err, results) => {
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
                    message: 'Randevu eklendi',
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

router.get('/', (req, res) => {
    const {company_id, profile_id} = req.query

    try {

            const sql = `select rendezvous.*,c.name_surname customer_name,p.name_surname taskmaster_name,db.name_surname done_by_name from rendezvous
    left join profile p on rendezvous.profile_id = p.id
    left join profile db on rendezvous.done_by = db.id
    left join customer c on rendezvous.customer_id = c.id
                where rendezvous.company_id = ? and rendezvous.is_visible = 1 GROUP BY rendezvous.id`

            db.query(sql, [company_id], (err, results) => {
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
                        message: "Randevu listesi alındı",
                        data: results,
                    })
                }else{
                    res.json({
                        code: 404,
                        message: "Randevu bulunamadı",
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
    let {customer_id,name, description, date, log_profile_id, log_company_id} = req.body
    let {rendezvous_id} = req.query

    if (!name)
        name = ""
    if (!description)
        description = ""
    if (!date)
        date = ""
    if (!customer_id)
        customer_id = ""

    try {

        let sql = `update rendezvous set 
        name = CASE WHEN '${name}' = '' or '${name}' IS NULL THEN name else '${name}' END,
        description = CASE WHEN  '${description}' IS NULL THEN description else '${description}' END,
        date = CASE WHEN '${date}' = '' or  '${date}' IS NULL THEN date else '${date}' END,
        customer_id = CASE WHEN '${customer_id}' = '' or '${customer_id}' IS NULL THEN customer_id else '${customer_id}' END
        where id = ?`

        db.query(sql, [rendezvous_id], (err, result) => {
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
                    message: 'Randevu güncellendi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Randevu bulunamadı',
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
    const {rendezvous_id} = req.query;
    const {log_profile_id,log_company_id} = req.body;

    let sql = 'update rendezvous set is_visible = false where id = ? and is_visible = 1'

    try {
        db.query(sql, [rendezvous_id], (err, results) => {
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
                    message: 'Randevu silindi'
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Randevu bulunamadı'
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

router.post('/setDone', (req, res) => {
    const {rendezvous_id} = req.query;
    const {is_done,done_by_id} = req.body;

    let sql = `update rendezvous set done_by = -1 where id = ?`

    if(is_done == 1)
        sql = 'update rendezvous set done_by = '+done_by_id+' where id = ?'

    try {
        db.query(sql, rendezvous_id, (err, results) => {
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
                    message: 'Randevu Güncellendi'
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Randevu bulunamadı'
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