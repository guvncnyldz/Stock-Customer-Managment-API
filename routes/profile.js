const express = require('express');
const base64 = require('../utils/base64Util')
const router = express.Router();

router.post('/login', (req, res) => {
    const {username, password} = req.body
    const sql = 'select * from profile where is_visible = true and username = ? and password = ?'

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
                res.json({
                    code: 200,
                    message: "Giriş başarılı",
                    data: result[0]
                })
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
    const {company_id, username, password, name_surname, photo, authority_id, log_profile_id} = req.body
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


                    sql = 'INSERT INTO profile (company_id, authority_id, username, password, name_surname, photo_path) VALUE (?,?,?,?,?,?)'

                    if (photo != "") {
                        photoPath = '/images/profile/' + username + Date.now() + '.png';
                        base64.decodeBase64(photo, photoPath)
                    }

                    db.query(sql, [company_id, authority_id, username, password, name_surname, photoPath], (err) => {
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

router.get('/', (req, res) => {
    const {profile_id} = req.query;

    let sql = 'select * from profile where id = ? and is_visible = true'

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
        if (photo) {
            photoPath = '/images/profile/' + username + Date.now() + '.png';
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