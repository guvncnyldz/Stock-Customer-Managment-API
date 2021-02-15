const express = require('express');
const base64 = require('../utils/base64Util')
const router = express.Router();

router.post('/add', (req, res) => {
    const {company_name, company_mail, subs_start_date, subs_period, username, password, name_surname, telephones, photo} = req.body
    const authority_id = 1

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

            if (result.length > 0) {
                res.json({
                    code: 409,
                    message: 'Bu kullanıcı adı kullanılmakta'
                })
            } else {
                sql = 'call createCompany(?,?,?,?,?,?,?,?,?)'

                let tel1 = telephones.replace(telephones[0], '');
                let tel2 = tel1.replace(tel1[tel1.length - 1], '');
                let finalTels = JSON.parse(tel2)

                if (photo != "") {
                    photoPath = '/images/profile/' + username + Date.now() + '.png';
                    base64.decodeBase64(photo, photoPath)
                }

                let startDate = new Date(subs_start_date)
                let endDate = new Date(subs_start_date);
                endDate.setMonth(endDate.getMonth() + Number(subs_period))

                db.query(sql, [company_name, company_mail, startDate, endDate, username, password, name_surname, photoPath, authority_id], (err, results) => {
                    if (err) {
                        res.json({
                            code: 500,
                            message: err
                        })

                        throw err

                    }
                    row = results[0][0];

                    let company_id = row.company_id;

                    sql = 'INSERT into telephone_no (company_id,tel_no) values ?'
                    let values = []

                    finalTels.forEach(finalTel => {
                        let array = []
                        array.push(company_id);
                        array.push(finalTel);

                        values.push(array)
                    })

                    db.query(sql, [values], (err) => {
                        if (err) {
                            res.json({
                                code: 500,
                                message: err
                            })

                            throw err
                        }

                        res.json({
                            code: 200,
                            message: "Şirket ve yönetici profili oluşturuldu",
                            data: row
                        })
                    })
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

router.post('/addPhone', (req, res) => {
    const {telephones, company_id,log_profile_id,log_company_id} = req.body
    let sql = 'INSERT into telephone_no (company_id,tel_no) values ?'

    try {
        let tel1 = telephones.replace(telephones[0], '');
        let tel2 = tel1.replace(tel1[tel1.length - 1], '');
        let finalTels = JSON.parse(tel2)

        let values = []

        finalTels.forEach(finalTel => {
            let array = []
            array.push(company_id);
            array.push(finalTel);

            values.push(array)
        })

        db.query(sql, [values], (err) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err
            }

            res.json({
                code: 200,
                message: "Telefon eklendi"
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

router.put('/info', (req, res) => {
    let {company_name, company_mail, subs_start_date, subs_period} = req.body;
    const {company_id} = req.query;

    if (!company_name)
        company_name = "";
    if (!company_mail)
        company_mail = "";
    if (!subs_start_date)
        subs_start_date = ""

    try {
        let startDate = ""
        let endDate = ""

        if (subs_start_date) {
            endDate = new Date(subs_start_date);
            endDate.setMonth(endDate.getMonth() + Number(subs_period))
            endDate = endDate.toISOString()
        }

        console.log(startDate)
        console.log(endDate)

        let sql = `update company set name = CASE WHEN '${company_name}' ='' or '${company_name}' IS NULL THEN name else '${company_name}' END,
        mail=CASE WHEN '${company_mail}' = '' or '${company_mail}' IS NULL THEN mail else '${company_mail}' END,
        subs_start_date=CASE WHEN '${subs_start_date}' = '' or '${subs_start_date}' IS NULL THEN subs_start_date else '${subs_start_date}' END,
        subs_end_date=CASE WHEN '${endDate}' ='' or '${endDate}' IS NULL THEN subs_end_date else '${endDate}' END
         where id = ?`

        db.query(sql, company_id, (err, results, field) => {

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
                    message: 'Şirket bilgileri güncellendi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Şirket bulunamadı',
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

router.get('/info', (req, res) => {
    const {company_id} = req.query;

    let sql = 'select * from company where id = ? and is_visible = true'

    try {
        db.query(sql, company_id, (err, results) => {
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
                    message: 'Şirket bilgileri alındı',
                    data: results[0]
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Şirket bulunamadı',
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

router.get('/phoneInfo', (req, res) => {
    const {company_id} = req.query;

    let sql = 'select * from telephone_no where company_id = ? and is_visible = true'

    try {
        db.query(sql, company_id, (err, results) => {
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
                    message: 'Telefon bilgileri alındı',
                    data: results
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Telefon bilgisi bulunamadı',
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

router.get('/profilesInfo', (req, res) => {
    const {company_id} = req.query;

    let sql = 'SELECT * FROM profile where company_id = ? and is_visible = true'

    try {
        db.query(sql, company_id, (err, results) => {
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
                    message: 'Profil bilgileri alındı',
                    data: results
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Profil bilgisi bulunamadı',
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

router.put('/phoneInfo', (req, res) => {
    const {phone_id} = req.query;
    let {telephone,log_profile_id,log_company_id} = req.body;

    if (!telephone)
        telephone = ""

    try {

        let sql = `update telephone_no set tel_no= case when '${telephone}'= '' or '${telephone}' is null then tel_no else '${telephone}' end where id = ?`


        db.query(sql, phone_id, (err, results) => {
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
                    message: 'Telefon bilgileri güncellendi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Telefon bulunamadı',
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

router.delete('/phone', (req, res) => {
    const {phone_id,log_profile_id,log_company_id} = req.query;

    let sql = 'update telephone_no set is_visible=false where id = ?'

    try {
        db.query(sql, phone_id, (err, results) => {
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
                    message: 'Telefon silindi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Telefon bulunamadı',
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