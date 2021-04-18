const express = require('express');
const router = express.Router();
const base64 = require('../utils/base64Util')

router.post('/addCategory', (req, res) => {
    const {category_name, company_id, log_profile_id} = req.body
    const sql = 'insert into expense_category (category_name,company_id) values (?,?)'

    db.query(sql, [category_name, company_id], (err, result) => {
        if (err) {
            res.json({
                code: 500,
                message: err
            })

            throw err
        }

        res.json({
            code: 200,
            message: 'Kategori Eklendi',
        })
    })
})

router.post('/addSubcategory', (req, res) => {
    const {expense_category_id, subcategory_name, log_profile_id, log_company_id} = req.body
    const sql = 'insert into expense_subcategory (subcategory_name,expense_category_id) values (?,?)'

    db.query(sql, [subcategory_name, expense_category_id], (err, result) => {
        if (err) {
            res.json({
                code: 500,
                message: err
            })

            throw err
        }

        res.json({
            code: 200,
            message: 'Alt Kategori Eklendi',
        })
    })
})

router.get('/categories', (req, res) => {
    const {company_id} = req.query
    const sql = `select c.*,sc.*  
from expense_category c
right join expense_subcategory sc on c.expense_category_id = sc.expense_category_id and sc.is_visible = true
where c.company_id = ? and c.is_visible = true`

    db.query(sql, [company_id], (err, results) => {
        if (err) {
            res.json({
                code: 500,
                message: err
            })

            throw err
        }

        //let row = JSON.parse(results[0].categories)

        if (results.length > 0) {
            res.json({
                code: 200,
                message: "Kategori listesi alındı",
                data: results,
            })
        } else {
            res.json({
                code: 404,
                message: "Kategori bulunamadı",
            })
        }
    })
})

router.delete('/category', (req, res) => {
    const {log_profile_id, log_company_id} = req.body
    const {category_id} = req.query

    let sql = 'update expense_category c ' +
        'left join expense_subcategory sc on sc.expense_category_id = c.expense_category_id ' +
        'left join expense e on e.expense_subcategory_id = sc.expense_subcategory_id ' +
        'set sc.is_visible = 0,c.is_visible = 0,e.is_visible = 0 where c.expense_category_id = ?'

    try {
        db.query(sql, [category_id], (err, results) => {
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
                    message: 'Kategori ve altındakiler silindi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Kategori bulunamadı',
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

router.delete('/subcategory', (req, res) => {
    const {log_profile_id, log_company_id} = req.body
    const {subcategory_id} = req.query

    let sql = 'update expense_subcategory sc left join expense e on e.expense_subcategory_id = sc.expense_subcategory_id set sc.is_visible = 0,e.is_visible = 0 where sc.expense_subcategory_id = ?'

    try {
        db.query(sql, [subcategory_id], (err, results) => {
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
                    message: 'Alt Kategori ve altındakiler silindi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Alt Kategori bulunamadı',
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

router.put('/category', (req, res) => {
    const {category_id, category_name, log_profile_id, log_company_id} = req.body

    let sql = 'update expense_category set category_name = ? where expense_category_id = ?'

    try {
        db.query(sql, [category_name, category_id], (err, results) => {
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
                    message: 'Kategori güncellendi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Kategori bulunamadı',
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

router.put('/subcategory', (req, res) => {
    const {subcategory_id, subcategory_name, log_profile_id, log_company_id} = req.body

    let sql = 'update expense_subcategory set subcategory_name = ? where expense_subcategory_id = ?'

    try {
        db.query(sql, [subcategory_name, subcategory_id], (err, results) => {
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
                    message: 'Alt Kategori güncellendi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Alt Kategori bulunamadı',
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
    const {company_id, subcategory_id, expense_name, expense_description, expense_photo, cost, log_profile_id} = req.body
    let sql = 'INSERT INTO expense (company_id,profile_id,expense_subcategory_id,expense_name,expense_description,cost,photo) VALUE (?,?,?,?,?,?,?)'

    let photoPath = "";

    if (expense_photo != null && expense_photo != "") {
        photoPath = '/images/expense/' + expense_name.replace(/ /g, '-') + Date.now() + '.png';
        base64.decodeBase64(expense_photo, photoPath)
    }

    db.query(sql, [company_id, log_profile_id, subcategory_id, expense_name, expense_description, cost, photoPath], (err) => {
        if (err) {
            res.json({
                code: 500,
                message: err
            })

            throw err
        }

        res.json({
            code: 200,
            message: "Gider oluşturuldu",
        })
    })

})

router.get('/', (req, res) => {
    const {subcategory_id} = req.query;

    let sql = 'select * from expense where is_visible = true and expense_subcategory_id = ?'

    try {
        db.query(sql, [subcategory_id], (err, results) => {
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
                    message: 'Gider alındı',
                    data: results
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Gider bulunamadı',
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
    const {expense_id} = req.query;

    let sql = 'update expense set is_visible = false where expense_id = ? and is_visible = true'

    try {
        db.query(sql, expense_id, (err, results) => {
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
                    message: 'Gider silindi'
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Gider bulunamadı'
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
    let {subcategory_id, expense_name, expense_description, expense_photo, cost,log_profile_id,log_company_id} = req.body
    const {expense_id} = req.query

    if (!subcategory_id)
        subcategory_id = ""
    if (!expense_name)
        expense_name = ""
    if (!expense_description)
        expense_description = ""
    if (!cost)
        cost = ""

    let photoPath = "";

    try {
        if (expense_photo != null && expense_photo != "") {
            photoPath = '/images/profile/' + expense_name.replace(/ /g, '-') + Date.now() + '.png';
            base64.decodeBase64(expense_photo, photoPath)
        }

        let sql = `update expense set 
        expense_subcategory_id = CASE WHEN '${subcategory_id}' = '' or '${subcategory_id}' IS NULL THEN expense_subcategory_id else '${subcategory_id}' END,
        expense_name = CASE WHEN '${expense_name}' = '' or '${expense_name}' IS NULL THEN expense_name else '${expense_name}' END,
        expense_description = CASE WHEN '${expense_description}' = '' or '${expense_description}' IS NULL THEN expense_description else '${expense_description}' END,
        cost = CASE WHEN '${cost}' = '' or '${cost}' IS NULL THEN cost else '${cost}' END,
        photo = CASE WHEN '${photoPath}' = '' or '${photoPath}' IS NULL THEN photo else '${photoPath}' END 
        where expense_id = ?`

        db.query(sql, [expense_id], (err, result) => {
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
                    message: 'Gider güncellendi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Gider bulunamadı',
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