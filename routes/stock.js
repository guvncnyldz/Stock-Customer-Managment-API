const express = require('express');
const router = express.Router();
const base64 = require('../utils/base64Util')

router.post('/addCategory', (req, res) => {
    const {category_name, company_id, log_profile_id} = req.body
    const sql = 'insert into stock_category (category_name,company_id) values (?,?)'

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

router.get('/categories', (req, res) => {
    const {company_id} = req.query
    const sql = `select * from stock_category where company_id = ? and is_visible = true`

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

router.get('/all', (req, res) => {
    const {company_id} = req.query
    const sql = `select JSON_ARRAYAGG(JSON_OBJECT(
        'category_id', c.category_name,
        'category_name', c.category_name,
        'stock', (select JSON_ARRAYAGG(JSON_OBJECT(
                'stock_id',s.stock_id,
                'stock_name', s.stock_name,
                'stock_description', s.stock_description,
                'stock_quantity', s.stock_quantity,
                'stock_photo', s.photo_path
            ))
                  from stock s
                  where s.stock_category_id = c.stock_category_id
                    and s.is_visible = true)
    )) as stocks
from stock_category c
where company_id = ?
  and c.is_visible = true`

    db.query(sql, [company_id], (err, results) => {
        if (err) {
            res.json({
                code: 500,
                message: err
            })

            throw err
        }

        let stocks = JSON.parse(results[0].stocks)

        if (results.length > 0) {
            res.json({
                code: 200,
                message: "Stok listesi alındı",
                data: stocks,
            })
        } else {
            res.json({
                code: 404,
                message: "Stok bulunamadı",
            })
        }
    })
})

router.delete('/category', (req, res) => {
    const {log_profile_id, log_company_id} = req.body
    const {category_id} = req.query

    let sql = 'update stock_category c ' +
        'left join stock s on c.stock_category_id = s.stock_category_id ' +
        'set c.is_visible = 0,s.is_visible = 0 where c.stock_category_id = ?'

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

router.put('/category', (req, res) => {
    const {category_id, category_name, log_profile_id, log_company_id} = req.body

    let sql = 'update stock_category set category_name = ? where stock_category_id = ?'

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

router.post('/add', (req, res) => {
    const {company_id, category_id, stock_name, stock_description, stock_photo, sale_price, purchase_price, stock_quantity, log_profile_id} = req.body
    let sql = 'INSERT INTO stock (company_id,profile_id,stock_category_id,stock_name,stock_description,sale_price,purchase_price,stock_quantity,photo_path) VALUE (?,?,?,?,?,?,?,?,?)'

    let photoPath = "";

    if (stock_photo != null && stock_photo != "") {
        photoPath = '/images/stock/' + stock_name.replace(/ /g, '-') + Date.now() + '.png';
        base64.decodeBase64(stock_photo, photoPath)
    }

    db.query(sql, [company_id, log_profile_id, category_id, stock_name, stock_description, sale_price, purchase_price, stock_quantity, photoPath], (err) => {
        if (err) {
            res.json({
                code: 500,
                message: err
            })

            throw err
        }

        res.json({
            code: 200,
            message: "Stok oluşturuldu",
        })
    })

})

router.get('/', (req, res) => {
    const {stock_id} = req.query;

    let sql = 'select * from stock where is_visible = true and stock_id = ?'

    try {
        db.query(sql, [stock_id], (err, results) => {
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
                    message: 'Stok alındı',
                    data: results
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Stok bulunamadı',
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
    const {stock_id} = req.query;

    let sql = 'update stock set is_visible = false where stock_id = ? and is_visible = true'

    try {
        db.query(sql, [stock_id], (err, results) => {
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
                    message: 'Stok silindi'
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Stok bulunamadı'
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
    let {category_id, stock_name, stock_description, stock_photo, sale_price, purchase_price, stock_quantity, log_profile_id,log_company_id} = req.body
    const {stock_id} = req.query

    if (!category_id)
        category_id = ""
    if (!stock_name)
        stock_name = ""
    if (!stock_description)
        stock_description = ""
    if (!sale_price)
        sale_price = ""
    if (!purchase_price)
        purchase_price = ""
    if (!stock_quantity)
        stock_quantity = ""

    let photoPath = "";

    try {
        if (stock_photo != null && stock_photo != "") {
            photoPath = '/images/profile/' + stock_name.replace(/ /g, '-') + Date.now() + '.png';
            base64.decodeBase64(stock_photo, photoPath)
        }

        let sql = `update stock set 
        stock_category_id = CASE WHEN '${category_id}' = '' or '${category_id}' IS NULL THEN stock_category_id else '${category_id}' END,
        stock_name = CASE WHEN '${stock_name}' = '' or '${stock_name}' IS NULL THEN stock_name else '${stock_name}' END,
        stock_description = CASE WHEN '${stock_description}' = '' or '${stock_description}' IS NULL THEN stock_description else '${stock_description}' END,
        sale_price = CASE WHEN '${sale_price}' = '' or '${sale_price}' IS NULL THEN sale_price else '${sale_price}' END,
        purchase_price = CASE WHEN '${purchase_price}' = '' or '${purchase_price}' IS NULL THEN purchase_price else '${purchase_price}' END,
        stock_quantity = CASE WHEN '${stock_quantity}' = '' or '${stock_quantity}' IS NULL THEN stock_quantity else '${stock_quantity}' END,
        photo_path = CASE WHEN '${photoPath}' = '' or '${photoPath}' IS NULL THEN photo_path else '${photoPath}' END 
        where stock_id = ?`

        db.query(sql, [stock_id], (err, result) => {
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
                    message: 'Stok güncellendi',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Stok bulunamadı',
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