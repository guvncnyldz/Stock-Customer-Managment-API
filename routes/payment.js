const express = require('express');
const router = express.Router();

router.post('/add', (req, res) => {
    const {customer_id, payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date, log_profile_id, log_company_id} = req.body
    const sql = 'call createPayment(?,?,?,?,?,?,?,?,?,?)'

    try {
        db.query(sql, [customer_id, log_profile_id,payment_name, payment_description, total_pay, first_paid, is_partial, partial_count, partial_start_date,log_company_id], (err, results) => {
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
                    message: 'Ödeme eklendi',
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

router.post('/partialPay', (req, res) => {
    const {log_profile_id, log_company_id} = req.body
    const {partial_id} = req.query
    const sql = 'call partialPayORBack(?,?,?)'

    try {
        db.query(sql, [partial_id, 1,log_profile_id], (err, results) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err
            }

            if (results[0][0].result) {
                res.json({
                    code: 200,
                    message: 'Ödeme gerçekleşti',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Ödeme gerçekleştirilemedi',
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

router.post('/partialPayBack', (req, res) => {
    const {log_profile_id, log_company_id} = req.body
    const {partial_id} = req.query
    const sql = "call partialPayORBack(?,?,?)"

    try {
        db.query(sql, [partial_id, 0,null], (err, results) => {
            if (err) {
                res.json({
                    code: 500,
                    message: err
                })

                throw err
            }


            if (results[0][0].result) {
                res.json({
                    code: 200,
                    message: 'Ödeme geri alındı',
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Ödeme geri alınamadı',
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

router.post('/cashPay', (req, res) => {
    const {payment_id, amount, log_profile_id, log_company_id} = req.body
    const sql = 'call cashPay(?,?,?)'

    try {
        db.query(sql, [payment_id, amount,log_profile_id], (err, results) => {
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
                    message: 'Ödeme alındı',
                })
            } else {
                res.json({
                    code: 200,
                    message: 'Ödeme alınamadı',
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

router.post('/cashPayBack', (req, res) => {
    const {cash_payment_id, amount, log_profile_id, log_company_id} = req.body
    const sql = 'call cashPayBack(?)'

    try {
        db.query(sql, [cash_payment_id], (err, results) => {
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
                    message: 'Ödeme geri alındı',
                })
            } else {
                res.json({
                    code: 200,
                    message: 'Ödeme geri alınamadı',
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

router.get('/partialDetail', (req, res) => {
    const {payment_id} = req.query
    const sql = 'select ppd.* from payment_partial_detail ppd where ppd.payment_id = ? and is_visible = true'

    try {
        db.query(sql, [payment_id], (err, results) => {
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
                    message: 'Taksitli ödeme detayı alındı',
                    data: results
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Taksitli ödeme detayı bulunamadı',
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

router.get('/cashDetail', (req, res) => {
    const {payment_id} = req.query
    const sql = 'select pcd.* from payment_cash_detail pcd where pcd.customer_payment_id = ? and is_visible = true'

    try {
        db.query(sql, [payment_id], (err, results) => {
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
                    message: 'Peşin ödeme detayı alındı',
                    data: results
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Peşin ödeme detayı bulunamadı',
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
    const {customer_id} = req.query
    const sql = 'select cp.* from customer_payment cp where customer_id = ?'

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
                    message: 'Ödemeler alındı',
                    data: results
                })
            } else {
                res.json({
                    code: 404,
                    message: 'Ödeme bulunamadı',
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
    const {payment_id} = req.query
    const sql = 'call deletePayment(?)'

    try {
        db.query(sql, [payment_id], (err, results) => {
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
                    message: 'Ödeme silindi',
                })
            } else {
                res.json({
                    code: 200,
                    message: 'Ödeme silinemedi',
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