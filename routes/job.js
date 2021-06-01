const express = require('express');
const router = express.Router();

router.post('/add', (req, res) => {
    const {company_id, profile_id, name, description, deadline_date, job_to, log_company_id} = req.body
    const sql = 'insert into job (company_id,profile_id,name,description,deadline_date,job_to,is_public) values (?,?,?,?,?,?,?)'

    try {
        let is_public = false;
        if (job_to == "")
            is_public = true;

        db.query(sql, [company_id, profile_id, name, description, deadline_date, job_to, is_public], (err, results) => {
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
                    message: 'İş eklendi',
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
    const {company_id, profile_id, authority} = req.query

    try {
        if (authority == 0 || authority == 1) {
            const sql = `select job.*,p.name_surname taskmaster_name,jt.name_surname job_to_name,db.name_surname done_by_name from job
    left join profile p on job.profile_id = p.id
    left join profile jt on job.job_to = jt.id
    left join profile db on job.done_by = db.id
                where job.company_id = ? and job.is_visible = 1 GROUP BY job.id`

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
                        message: "İş listesi alındı",
                        data: results,
                    })
                }else{
                    res.json({
                        code: 404,
                        message: "İş bulunamadı",
                    })
                }
            })

        } else {
            const sql = `select job.*,p.name_surname taskmaster_name,jt.name_surname job_to_name,db.name_surname done_by_name from job
    left join profile p on job.profile_id = p.id
    left join profile jt on job.job_to = jt.id
    left join profile db on job.done_by = db.id
where ((job.profile_id = ?) or (job.is_public = 1) or (job.job_to = ?)) and job.is_visible = 1 GROUP BY job.id`

            db.query(sql, [profile_id,profile_id], (err, results) => {
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
                        message: "İş listesi alındı",
                        data: results
                    })
                }
                else
                {
                    res.json({
                        code: 404,
                        message: "İş bulunamadı",
                    })
                }
            })
        }
    } catch (error) {
        res.json({
            code: 500,
            message: error.toString()
        })
        throw error
    }
})

router.put('/', (req, res) => {
    let {name, description, deadline_date, job_to, log_profile_id, log_company_id} = req.body
    let {job_id} = req.query

    if (!name)
        name = ""
    if (!description)
        description = ""
    if (!description)
        description = ""
    if (!deadline_date)
        deadline_date = ""
    if (!job_to)
        job_to = ""

    try {

        let sql = `update job set 
        name = CASE WHEN '${name}' = '' or '${name}' IS NULL THEN name else '${name}' END,
        description = CASE WHEN  '${description}' IS NULL THEN description else '${description}' END,
        deadline_date = CASE WHEN '${deadline_date}' = '' or  '${deadline_date}' IS NULL THEN deadline_date else '${deadline_date}' END,
        is_public = CASE WHEN '${job_to}' = '' or '${job_to}' IS NULL THEN 1 else 0 END,
        job_to = CASE WHEN '${job_to}' = '' or '${job_to}' IS NULL THEN job_to else '${job_to}' END
        where job.id = ?`

        db.query(sql, [job_id], (err, result) => {
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
                    message: 'İş güncellendi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'İş bulunamadı',
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
    const {job_id} = req.query;
    const {log_profile_id,log_company_id} = req.body;

    let sql = 'update job set is_visible = false where id = ? and is_visible = 1'

    try {
        db.query(sql, job_id, (err, results) => {
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
                    message: 'İş silindi'
                })
            } else {
                res.json({
                    code: 404,
                    message: 'İş bulunamadı'
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
    const {job_id} = req.query;
    const {is_done,done_by_id} = req.body;

    let sql = `update job set done_by = -1 where id = ?`

    if(is_done == 1)
        sql = 'update job set done_by = '+done_by_id+', done_date= current_timestamp where id = ?'

    try {
        db.query(sql, job_id, (err, results) => {
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
                    message: 'İş Güncellendi'
                })
            } else {
                res.json({
                    code: 404,
                    message: 'İş bulunamadı'
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