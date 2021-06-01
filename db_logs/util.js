exports.add_stock_log = (profile_id, company_id, quantity, stock_id, stock_type, log_type, price) => {
    const sql = 'insert into stock_log (company_id, profile_id, stock_id,quantity,stock_type, log_type,price) VALUES (?,?,?,?,?,?,?)'

    db.query(sql, [company_id, profile_id, stock_id, quantity, stock_type, log_type,price], (err, result) => {
        if (err) {
            console.log("Log hatası: ".err);
        }
    })
}

exports.add_customer_log = (profile_id, company_id, customer_id, log_type) => {
    const sql = 'insert into customer_log (company_id, profile_id, customer_id, log_type) VALUES (?,?,?,?)'

    db.query(sql, [company_id, profile_id, customer_id, log_type], (err, result) => {
        if (err) {
            console.log("Log hatası: ".err);
        }
    })
}