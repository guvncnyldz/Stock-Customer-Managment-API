const express = require('express');
const router = express.Router();
router.get('/customer', (req, res) => {
    const {profile_id} = req.query;
    const sql = 'select *,log_type+0 as log_type_id from customer_log where profile_id = ?'
    db.query(sql, [profile_id], (err, result) => {
        if (err) {
            res.json({code: 500, message: err})
            throw err
        }
        if (result.length > 0) {
            res.json({code: 200, message: 'Kullanıcı müşteri logları getirildi', data: result})
        } else {
            res.json({code: 404, message: 'Log Bulunamadı',})
        }
    })
})

router.get('/incomeAsNumber', (req, res) => {
    const {profile_id, start_date, end_date} = req.query;
    const sql = `select JSON_OBJECT(
               'total_income', coalesce((select sum(pcd.amount)
                                         from customer_payment cp
                                                  inner join payment_cash_detail pcd
                                                             on pcd.is_visible = true and
                                                                cp.id = pcd.customer_payment_id and
                                                                (pcd.paid_date between ? and ?)
                                         where cp.is_partial = 0
                                           and cp.profile_id = ?
                                           and cp.is_visible = true), 0) +
                               coalesce((select sum(ppd.amount)
                                         from customer_payment cp
                                                  inner join payment_partial_detail ppd
                                                             on ppd.is_paid = true and ppd.is_visible = true and
                                                                cp.id = ppd.payment_id and
                                                                (ppd.paid_date between ? and ?)
                                         where cp.is_partial = 1
                                           and cp.profile_id = ?
                                           and cp.is_visible = true), 0) +
                               coalesce((select sum(sl.quantity * sl.price)
                                         from stock_log sl
                                         where (sl.create_date between ? and ?)
                                           and sl.profile_id = ?
                                           and sl.is_visible = true
                                           and sl.log_type = 'Satıldı'), 0)
           ) as profile_log
`

    db.query(sql, [start_date, end_date, profile_id, start_date, end_date, profile_id, start_date, end_date, profile_id], (err, result) => {
        if (err) {
            res.json({code: 500, message: err})
            throw err
        }

        if (result.length > 0) {
            res.json({
                code: 200,
                message: 'Kullanıcı gelir değer logları getirildi',
                data: JSON.parse(result[0].profile_log)
            })
        } else {
            res.json({code: 404, message: 'Log Bulunamadı',})
        }
    })
})

router.get('/outcomeAsNumber', (req, res) => {
    const {profile_id, start_date, end_date} = req.query;
    const sql = 'select JSON_OBJECT(\n' +
        '               \'total_outcome\', (coalesce((select sum(e.cost) from expense e where (e.create_date between ? and ?) and e.profile_id = ? and e.is_visible = true),0) +\n' +
        '                          coalesce((select sum(sl.quantity * sl.price)\n' +
        '                                    from stock_log sl\n' +
        '                                    where (sl.create_date between ? and ?)\n' +
        '                                         and sl.profile_id = ?\n' +
        '                                      and sl.is_visible = true\n' +
        '                                      and sl.log_type = \'Eklendi\'), 0))\n' +
        '           ) as company_log\n'

    db.query(sql, [start_date, end_date, profile_id, start_date, end_date, profile_id], (err, result) => {
        if (err) {
            res.json({code: 500, message: err})
            throw err
        }

        if (result.length > 0) {
            res.json({
                code: 200,
                message: 'Şirket gider değer logları getirildi',
                data: JSON.parse(result[0].company_log)
            })
        } else {
            res.json({code: 404, message: 'Log Bulunamadı',})
        }
    })
})

router.get('/income', (req, res) => {
    const {profile_id, start_date, end_date} = req.query;
    const sql = 'select JSON_OBJECT(\n' +
        '               \'cash_payments\', (select JSON_ARRAYAGG(JSON_OBJECT(\'payment_id\', cp.id,\n' +
        '                                                                  \'cash_id\', pcd.id,\n' +
        '                                                                  \'customer_id\', c.id,\n' +
        '                                                                  \'customer_name\', c.name_surname,\n' +
        '                                                                  \'cash_amount\', pcd.amount,\n' +
        '                                                                  \'date\', pcd.paid_date))\n' +
        '                                 from customer_payment cp\n' +
        '                                          left join customer c on cp.customer_id = c.id\n' +
        '                                          inner join payment_cash_detail pcd\n' +
        '                                                     on pcd.is_visible = true and\n' +
        '                                                        cp.id = pcd.customer_payment_id and\n' +
        '                                                        (pcd.paid_date between ? and ?)\n' +
        '                                 where cp.is_partial = 0\n' +
        '                                   and cp.profile_id = ?\n' +
        '                                   and cp.is_visible = true),\n' +
        '               \'partial_payments\', (select JSON_ARRAYAGG(JSON_OBJECT(\n' +
        '                \'payment_id\', cp.id,\n' +
        '                \'cash_id\', ppd.id,\n' +
        '                \'customer_id\', c.id,\n' +
        '                \'customer_name\', c.name_surname,\n' +
        '                \'cash_amount\', ppd.amount,\n' +
        '                \'date\', ppd.paid_date\n' +
        '            ))\n' +
        '                                    from customer_payment cp\n' +
        '                                             left join customer c on cp.customer_id = c.id\n' +
        '                                             inner join payment_partial_detail ppd\n' +
        '                                                        on ppd.is_paid = true and ppd.is_visible = true and\n' +
        '                                                           cp.id = ppd.payment_id and\n' +
        '                                                           (ppd.paid_date between ? and ?)\n' +
        '                                    where cp.is_partial = 1\n' +
        '                                      and cp.profile_id = ?\n' +
        '                                      and cp.is_visible = true),\n' +
        '               \'stocks\', (select JSON_ARRAYAGG(JSON_OBJECT(\n' +
        '                \'stock_log_id\', sl.stock_id,\n' +
        '                \'stock_log_price\', sl.price,\n' +
        '                \'stock_log_quantity\', sl.quantity,\n' +
        '                \'device_id\',d.id,\n' +
        '                \'device_model\',d.model,\n' +
        '                \'device_profit\',d.profit,\n' +
        '                \'filter_id\',f.id,\n' +
        '                \'filter_name\',f.name,\n' +
        '                \'filter_profit\',f.profit,\n' +
        '                \'stock_id\',s.stock_id,\n' +
        '                \'stock_name\',s.stock_name,\n' +
        '                \'stock_profit\',s.stock_profit,\n' +
        '                   \'create_date\',sl.create_date\n' +
        '            ))\n' +
        '                          from stock_log sl\n' +
        '                                   left join device d on sl.stock_type = \'Cihaz\' and d.id = sl.stock_id\n' +
        '                                   left join filter f on sl.stock_type = \'Filtre\' and f.id = sl.stock_id\n' +
        '                                   left join stock s on sl.stock_type = \'Stok\' and s.stock_id = sl.stock_id\n' +
        '                          where (sl.create_date between ? and ?)\n' +
        '                            and sl.profile_id = ?\n' +
        '                            and sl.is_visible = true\n' +
        '                            and sl.log_type = \'Satıldı\')\n' +
        '           ) as company_log'

    db.query(sql, [start_date, end_date, profile_id, start_date, end_date, profile_id, start_date, end_date, profile_id], (err, result) => {
        if (err) {
            res.json({code: 500, message: err})
            throw err
        }

        if (result.length > 0) {
            res.json({code: 200, message: 'Şirket gelir logları getirildi', data: JSON.parse(result[0].company_log)})
        } else {
            res.json({code: 404, message: 'Log Bulunamadı',})
        }
    })
})

router.get('/outcome', (req, res) => {
    const {profile_id, start_date, end_date} = req.query;
    const sql = 'select JSON_OBJECT(\n' +
        '               \'expense\', (select JSON_ARRAYAGG(JSON_OBJECT(\'expense_id\', e.expense_id,\n' +
        '                                                                  \'expense_name\', e.expense_name,\n' +
        '                                                                  \'cost\', e.cost,\n' +
        '                                                                  \'expense_description\', e.expense_description))\n' +
        '                                 from expense e\n' +
        '                                 where (e.create_date between ? and ?)\n' +
        '                                   and e.profile_id = ?\n' +
        '                                   and e.is_visible = true),\n' +
        '               \'stocks\', (select JSON_ARRAYAGG(JSON_OBJECT(\n' +
        '                \'stock_log_id\', sl.stock_id,\n' +
        '                \'stock_log_price\', sl.price,\n' +
        '                \'stock_log_quantity\', sl.quantity,\n' +
        '                \'device_id\', d.id,\n' +
        '                \'device_model\', d.model,\n' +
        '                \'device_profit\', d.profit,\n' +
        '                \'filter_id\', f.id,\n' +
        '                \'filter_name\', f.name,\n' +
        '                \'filter_profit\', f.profit,\n' +
        '                \'stock_id\', s.stock_id,\n' +
        '                \'stock_name\', s.stock_name,\n' +
        '                \'stock_profit\', s.stock_profit,\n' +
        '                   \'create_date\',sl.create_date\n' +
        '            ))\n' +
        '                          from stock_log sl\n' +
        '                                   left join device d on sl.stock_type = \'Cihaz\' and d.id = sl.stock_id\n' +
        '                                   left join filter f on sl.stock_type = \'Filtre\' and f.id = sl.stock_id\n' +
        '                                   left join stock s on sl.stock_type = \'Stok\' and s.stock_id = sl.stock_id\n' +
        '                          where (sl.create_date between ? and ?)\n' +
        '                            and sl.profile_id = ?\n' +
        '                            and sl.is_visible = true\n' +
        '                            and sl.log_type = \'Eklendi\')\n' +
        '           ) as company_log'

    db.query(sql, [start_date, end_date, profile_id, start_date, end_date, profile_id], (err, result) => {
        if (err) {
            res.json({code: 500, message: err})
            throw err
        }

        if (result.length > 0) {
            res.json({code: 200, message: 'Şirket gider logları getirildi', data: JSON.parse(result[0].company_log)})
        } else {
            res.json({code: 404, message: 'Log Bulunamadı',})
        }
    })
})

router.get('/addedStockCount', (req, res) => {
    const {profile_id, start_date, end_date} = req.query;
    const sql = `select count(id) as count from stock_log where profile_id = ? and is_visible = true and log_type = 'Eklendi' and (create_date between ? and ?)`

    db.query(sql, [profile_id, start_date, end_date], (err, result) => {
        if (err) {
            res.json({code: 500, message: err})
            throw err
        }

        if (result.length > 0) {
            res.json({code: 200, message: 'Şirket stok logları getirildi', data: result})
        } else {
            res.json({code: 404, message: 'Log Bulunamadı',})
        }
    })
})

router.get('/removedStockCount', (req, res) => {
    const {profile_id, start_date, end_date} = req.query;
    const sql = `select count(id) as count from stock_log where profile_id = ? and is_visible = true and log_type = 'Satıldı' and (create_date between ? and ?)`

    db.query(sql, [profile_id, start_date, end_date], (err, result) => {
        if (err) {
            res.json({code: 500, message: err})
            throw err
        }

        if (result.length > 0) {
            res.json({code: 200, message: 'Şirket stok logları getirildi', data: result})
        } else {
            res.json({code: 404, message: 'Log Bulunamadı',})
        }
    })
})

router.get('/maintenance', (req, res) => {
    const {profile_id, start_date, end_date} = req.query;
    const sql = `select m.*, c.name_surname
from maintenance m
         left join customer c on m.customer_id = c.id
where m.profile_id = ?
  and m.is_visible = true
  and (maintenanced_date between ? and ?)`

    db.query(sql, [profile_id, start_date, end_date], (err, result) => {
        if (err) {
            res.json({code: 500, message: err})
            throw err
        }

        if (result.length > 0) {
            res.json({code: 200, message: 'Şirket bakım logları getirildi', data: result})
        } else {
            res.json({code: 404, message: 'Log Bulunamadı',})
        }
    })
})

router.get('/job', (req, res) => {
    const {profile_id, start_date, end_date} = req.query;
    const sql = `select j.*, pp.name_surname as creator_name,pp.id as creator_id,pd.name_surname as doner_name,pd.id as doner_id
from job j
         left join profile pp on j.profile_id = pp.id
         left join profile pd on j.done_by = pd.id
where (j.done_by = ?
  or j.profile_id = ?)
  and j.is_visible = true
  and (j.done_date between ? and ?)`

    db.query(sql, [profile_id,profile_id, start_date, end_date], (err, result) => {
        if (err) {
            res.json({code: 500, message: err})
            throw err
        }

        if (result.length > 0) {
            res.json({code: 200, message: 'Şirket iş logları getirildi', data: result})
        } else {
            res.json({code: 404, message: 'Log Bulunamadı',})
        }
    })
})

router.get('/rendezvous', (req, res) => {
    const {profile_id, start_date, end_date} = req.query;
    const sql = `select r.*, pp.name_surname as creator_name, pp.id as creator_id, pd.name_surname as doner_name, pd.id as doner_id
from rendezvous r
         left join profile pp on r.profile_id = pp.id
         left join profile pd on r.done_by = pd.id
where (r.profile_id = ?
  or r.done_by = ?)
  and r.is_visible = true
  and (r.date between ? and ?)`

    db.query(sql, [profile_id,profile_id, start_date, end_date], (err, result) => {
        if (err) {
            res.json({code: 500, message: err})
            throw err
        }

        if (result.length > 0) {
            res.json({code: 200, message: 'Şirket randevu logları getirildi', data: result})
        } else {
            res.json({code: 404, message: 'Log Bulunamadı',})
        }
    })
})

module.exports = router