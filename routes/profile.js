const express = require('express');
const base64 = require('../utils/base64Util')
const router = express.Router();

router.post('/login', (req, res) => {
    const {username, password} = req.body
    const sql = 'select p.*,c.subs_end_date from profile p\n' +
        'right join company c on c.id = p.company_id\n' +
        'where p.is_visible = true and p.is_active = true and p.username = ? and p.password = ?\n'

    try {
        db.query(sql, [username, password], (err, result) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err
            }


            if (result.length > 0) {

                let end_date = new Date(result[0].subs_end_date)

                if (end_date > new Date()) {
                    res.json({
                        code: 200,
                        message: "Giriş başarılı",
                        data: result[0]
                    })
                } else {
                    res.json({
                        code: 403,
                        message: "Abonelik süresi dolmuştur.",
                    })
                }

            } else {
                res.json({
                    code: 404,
                    message: "Kullanıcı bulunamadı"
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

router.post('/add', (req, res) => {
    const {company_id, username, password, name_surname, photo, authority_id, tel_no, log_profile_id} = req.body
    let sql = 'select id from profile where username = ?'

    let photoPath = "";

    try {

        db.query(sql, username, (err, result) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err

            }

            try {
                if (result.length > 0) {
                    res.json({
                        code: 409,
                        message: 'Bu kullanıcı adı kullanılmakta'
                    })
                } else {


                    sql = 'INSERT INTO profile (company_id, authority_id, username, password, name_surname, photo_path,tel_no) VALUE (?,?,?,?,?,?,?)'

                    if (photo != null && photo != "") {
                        photoPath = '/images/profile/' + username.replace(/ /g, '-') + Date.now() + '.png';
                        base64.decodeBase64(photo, photoPath)
                    }

                    db.query(sql, [company_id, authority_id, username, password, name_surname, photoPath, tel_no], (err) => {
                        if (err) {
                            res.json({
                                code: 500,
                                message: err
                            })

                            throw err
                        }

                        res.json({
                            code: 200,
                            message: "Profil oluşturuldu",
                        })
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
    } catch (error) {
        res.json({
            code: 500,
            message: error.toString()
        })
        throw error
    }
})

router.get('/log', (req, res) => {
    const {profile_id} = req.query
    const sql = 'select JSON_ARRAYAGG(JSON_OBJECT(\n' +
        '        \'maintenance\', (select count(m.id) from maintenance m where m.profile_id=? and m.is_visible=true),\n' +
        '        \'job\', (select count(j.id) from job j where j.done_by=? and j.is_visible=true),\n' +
        '        \'rendezvous\', (select count(r.id) from rendezvous r where r.done_by=? and r.is_visible=true),\n' +
        '        \'payment\',(select count(pp.id) from payment_partial_detail pp where pp.profile_id=? and pp.is_visible = true)+(select count(pc.id) from payment_cash_detail pc where pc.profile_id=? and pc.is_visible=true),\n' +
        '        \'added_customer\', (select count(cl.id) from customer_log cl where cl.profile_id=? and cl.is_visible=true and cl.log_type=\'Eklendi\')\n' +
        '        )) as logs\n';

    try {
        db.query(sql, [profile_id, profile_id, profile_id, profile_id, profile_id, profile_id], (err, results) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err

            }

            if (results.length != 0) {

                res.json({
                    code: 200,
                    message: 'Kullanıcı logları alındı',
                    data: JSON.parse(results[0].logs)
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Kullanıcı bulunamadı',
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
    const {profile_id} = req.query;

    let sql = 'select profile.*,authority.name as authority_name, c.name as company_name from profile left join company c on c.id = profile.company_id = c.id left join authority on profile.authority_id = authority.id where profile.id = ? and profile.is_visible = true'

    try {
        db.query(sql, profile_id, (err, results) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err

            }

            if (results.length != 0) {

                res.json({
                    code: 200,
                    message: 'Kullanıcı bilgileri alındı',
                    data: results[0]
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Kullanıcı bulunamadı',
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

router.get('/today', (req, res) => {
    const {company_id, profile_id} = req.query;

    let sql = 'select JSON_ARRAYAGG(JSON_OBJECT(\n' +
        '        \'partial_payments\', (select JSON_ARRAYAGG(JSON_OBJECT(\n' +
        '                \'payment_id\', cp.id,\n' +
        '                \'payment_name\', cp.name,\n' +
        '                \'payment_description\', cp.description,\n' +
        '                \'payment_total_pay\', cp.total_pay,\n' +
        '                \'payment_total_paid\', cp.total_paid,\n' +
        '                \'customer_id\', cp.customer_id,\n' +
        '                \'customer_name\', pc.name_surname,\n' +
        '                \'customer_visibility\', pc.is_visible,\n' +
        '                \'partial_detail_id\', ppd.id,\n' +
        '                \'partial_amount\', ppd.amount\n' +
        '            ))\n' +
        '                             from customer_payment cp\n' +
        '                                      right join payment_partial_detail ppd\n' +
        '                                                 on cp.id = ppd.payment_id and DATE(ppd.payment_date) = CURDATE() and\n' +
        '                                                    ppd.is_visible = true' +
        '                                                       and ppd.is_paid = 0\n' +
        '                                      left join customer pc on ppd.customer_id = pc.id\n' +
        '                             where cp.company_id = ?\n' +
        '                               and cp.is_partial = 1\n' +
        '                               and cp.is_visible = true),\n' +
        '        \'maintenances\', (select JSON_ARRAYAGG(JSON_OBJECT(\n' +
        '                \'customer_id\', m.customer_id,\n' +
        '                \'customer_name\', c.name_surname,\n' +
        '                \'customer_visibility\', c.is_visible,\n' +
        '                \'maintenance_id\', m.id,\n' +
        '                \'maintenance_operation\', m.operation,\n' +
        '                \'maintenance_description\', m.description,\n' +
        '                \'customer_device_id\', m.customer_device_id\n' +
        '            )\n' +
        '                                    )\n' +
        '                         from maintenance m\n' +
        '                                  left join customer c on m.customer_id = c.id\n' +
        '                         where m.company_id = ?\n' +
        '                           and m.is_visible = true\n' +
        '                           and DATE(m.maintenance_date) = CURDATE()),\n' +
        '        \'rendezvous\', (select JSON_ARRAYAGG(JSON_OBJECT(\n' +
        '                \'customer_id\', c.id,\n' +
        '                \'customer_name\', c.name_surname,\n' +
        '                \'customer_visibility\', c.is_visible,\n' +
        '                \'rendezvous_id\', r.id,\n' +
        '                \'rendezvous_name\', r.name,\n' +
        '                \'rendezvous_date\', r.date,\n' +
        '                \'rendezvous_description\', r.description\n' +
        '            ))\n' +
        '                       from rendezvous r\n' +
        '                                left join customer c on r.customer_id = c.id\n' +
        '                       where r.company_id = ?\n' +
        '                         and r.done_by = -1\n' +
        '                         and r.is_visible = true\n' +
        '                         and DATE(r.date) = CURDATE()\n' +
        '        ),\n' +
        '        \'jobs\', (select JSON_ARRAYAGG(JSON_OBJECT(\n' +
        '            \'job_id\',j.id,\n' +
        '            \'job_name\',j.name,\n' +
        '            \'job_description\',j.description\n' +
        '            ))\n' +
        '                 from job j\n' +
        '                 where j.company_id = ?\n' +
        '                   and (j.job_to = ? or j.job_to = 0)\n' +
        '                   and DATE(j.deadline_date) = CURDATE()\n' +
        '                   and j.is_visible = true\n' +
        '                   and j.done_by = -1\n' +
        '        )\n' +
        '    )) today'

    try {
        db.query(sql, [company_id, company_id, company_id, company_id, profile_id], (err, results) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err

            }


            if (JSON.parse(results[0].today)) {

                res.json({
                    code: 200,
                    message: 'Bugünün işleri alındı',
                    data: JSON.parse(results[0].today)
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
    const {profile_id} = req.query;

    let sql = 'update profile set is_visible = false where id = ? and is_visible = true'

    try {
        db.query(sql, profile_id, (err, results) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err

            }

            console.log(results)

            if (results.affectedRows > 0) {

                res.json({
                    code: 200,
                    message: 'Kullanıcı silindi'
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Kullanıcı bulunamadı'
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

router.post('/setActive', (req, res) => {
    const {profile_id, is_active, log_profile_id, log_company_id} = req.body;
    let sql = 'update profile set is_active = ? where id = ?'

    try {
        db.query(sql, [is_active, profile_id], (err, results) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err

            }

            console.log(results)

            if (results.affectedRows > 0) {

                res.json({
                    code: 200,
                    message: 'Kullanıcı aktifliği değiştirildi'
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Kullanıcı bulunamadı'
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
    let {username, password, name_surname, photo, authority_id, log_profile_id, log_company_id} = req.body
    const {profile_id} = req.query

    if (!username)
        username = ""
    if (!password)
        password = ""
    if (!name_surname)
        name_surname = ""
    if (!authority_id)
        authority_id = ""

    let photoPath = "";

    try {
        if (photo != null && photo != "") {
            photoPath = '/images/profile/' + username.replace(/ /g, '-') + Date.now() + '.png';
            base64.decodeBase64(photo, photoPath)
        }

        let sql = `update profile set 
        authority_id = CASE WHEN '${authority_id}' = '' or '${authority_id}' IS NULL THEN authority_id else '${authority_id}' END,
        name_surname = CASE WHEN '${name_surname}' = '' or '${name_surname}' IS NULL THEN name_surname else '${name_surname}' END,
        password = CASE WHEN '${password}' = '' or '${password}' IS NULL THEN password else '${password}' END,
        username = CASE WHEN '${username}' = '' or '${username}' IS NULL THEN username else '${username}' END,
        photo_path = CASE WHEN '${photoPath}' = '' or '${photoPath}' IS NULL THEN photo_path else '${photoPath}' END 
        where id = ?`

        db.query(sql, profile_id, (err, result) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err
            }

            console.log(result)
            if (result.affectedRows > 0) {
                res.json({
                    code: 200,
                    message: 'Profil güncellendi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Profil bulunamadı',
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