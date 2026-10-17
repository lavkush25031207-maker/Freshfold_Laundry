create table users (
    id bigint primary key auto_increment,
    name varchar(100) not null,
    email varchar(190) not null unique,
    password_hash varchar(255) not null,
    role enum('CUSTOMER','ADMIN') not null default 'CUSTOMER',
    created_at timestamp not null default current_timestamp
);

create table addresses (
    id bigint primary key auto_increment,
    user_id bigint not null,
    label varchar(40),
    address_text varchar(500) not null,
    pincode char(6) not null,
    is_default boolean not null default false,
    constraint fk_addresses_user foreign key (user_id) references users(id)
);

create table services (
    id bigint primary key auto_increment,
    name varchar(100) not null,
    unit enum('KG','ITEM') not null,
    price decimal(10,2) not null,
    active boolean not null default true
);

create table service_areas (
    id bigint primary key auto_increment,
    pincode char(6) not null unique,
    area_name varchar(100) not null,
    active boolean not null default true
);

create table pickup_slots (
    id bigint primary key auto_increment,
    label varchar(100) not null,
    starts_at datetime not null,
    ends_at datetime not null,
    capacity int not null,
    booked_count int not null default 0,
    active boolean not null default true
);

create table orders (
    id bigint primary key auto_increment,
    order_number varchar(30) not null unique,
    user_id bigint null,
    address_id bigint null,
    address_text varchar(500) not null,
    pincode char(6) not null,
    pickup_slot_id bigint not null,
    status enum('BOOKED','PICKED_UP','CLEANING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') not null,
    payment_method enum('CASH_ON_DELIVERY') not null default 'CASH_ON_DELIVERY',
    estimated_total decimal(10,2) not null,
    actual_total decimal(10,2) null,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp on update current_timestamp,
    constraint fk_orders_user foreign key (user_id) references users(id),
    constraint fk_orders_address foreign key (address_id) references addresses(id),
    constraint fk_orders_slot foreign key (pickup_slot_id) references pickup_slots(id)
);

create table order_items (
    id bigint primary key auto_increment,
    order_id bigint not null,
    service_id bigint not null,
    quantity decimal(10,2) not null,
    unit_price decimal(10,2) not null,
    line_total decimal(10,2) not null,
    constraint fk_items_order foreign key (order_id) references orders(id),
    constraint fk_items_service foreign key (service_id) references services(id)
);

create table order_status_history (
    id bigint primary key auto_increment,
    order_id bigint not null,
    status enum('BOOKED','PICKED_UP','CLEANING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') not null,
    note varchar(255),
    created_at timestamp not null default current_timestamp,
    constraint fk_history_order foreign key (order_id) references orders(id)
);

create index idx_orders_status_created on orders(status, created_at);
create index idx_orders_user on orders(user_id);
create index idx_history_order on order_status_history(order_id, created_at);

