insert into services(name, unit, price) values
    ('Wash & Fold', 'KG', 79.00),
    ('Dry Cleaning', 'ITEM', 149.00),
    ('Ironing', 'ITEM', 15.00);

insert into service_areas(pincode, area_name) values
    ('110001', 'Central Delhi'),
    ('110016', 'South Delhi'),
    ('122001', 'Gurugram'),
    ('201301', 'Noida');

insert into pickup_slots(label, starts_at, ends_at, capacity) values
    ('Tomorrow, 9–11 AM', date_add(current_date, interval 1 day) + interval 9 hour, date_add(current_date, interval 1 day) + interval 11 hour, 20),
    ('Tomorrow, 2–4 PM', date_add(current_date, interval 1 day) + interval 14 hour, date_add(current_date, interval 1 day) + interval 16 hour, 20),
    ('Day after tomorrow, 9–11 AM', date_add(current_date, interval 2 day) + interval 9 hour, date_add(current_date, interval 2 day) + interval 11 hour, 20);

