alter table orders
    add column payment_status enum('PENDING','PAID') not null default 'PENDING' after payment_method;
