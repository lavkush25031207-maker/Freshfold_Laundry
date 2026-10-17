create table auth_tokens (
    id bigint primary key auto_increment,
    user_id bigint not null,
    token_hash char(64) not null unique,
    expires_at datetime not null,
    created_at timestamp not null default current_timestamp,
    constraint fk_auth_tokens_user foreign key (user_id) references users(id) on delete cascade
);

create index idx_auth_tokens_expiry on auth_tokens(expires_at);

create table delivery_agents (
    id bigint primary key auto_increment,
    name varchar(100) not null,
    phone varchar(20) not null,
    vehicle_number varchar(30) not null,
    active boolean not null default true,
    created_at timestamp not null default current_timestamp
);

insert into delivery_agents(name, phone, vehicle_number) values
    ('Aman Kumar', '+91 98765 40001', 'DL 3S FF 1201'),
    ('Riya Sharma', '+91 98765 40002', 'DL 3S FF 1202');

alter table orders
    modify status enum(
        'BOOKED','PICKUP_ASSIGNED','OUT_FOR_PICKUP','PICKED_UP','AT_SHOP',
        'CLEANING','READY_FOR_DELIVERY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'
    ) not null,
    add column delivery_agent_id bigint null after pickup_slot_id,
    add column estimated_delivery_at datetime null after actual_total,
    add constraint fk_orders_delivery_agent foreign key (delivery_agent_id) references delivery_agents(id);

alter table order_status_history
    modify status enum(
        'BOOKED','PICKUP_ASSIGNED','OUT_FOR_PICKUP','PICKED_UP','AT_SHOP',
        'CLEANING','READY_FOR_DELIVERY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'
    ) not null;
