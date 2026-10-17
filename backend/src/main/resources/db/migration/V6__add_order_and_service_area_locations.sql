alter table service_areas
    add column latitude decimal(10,7) null,
    add column longitude decimal(10,7) null;

update service_areas set latitude = 28.6304000, longitude = 77.2177000 where pincode = '110001';
update service_areas set latitude = 28.5483000, longitude = 77.1969000 where pincode = '110016';
update service_areas set latitude = 28.4595000, longitude = 77.0266000 where pincode = '122001';
update service_areas set latitude = 28.5355000, longitude = 77.3910000 where pincode = '201301';
update service_areas set latitude = 28.5053000, longitude = 77.3047000 where pincode = '110080';

alter table orders
    add column pickup_latitude decimal(10,7) null after pincode,
    add column pickup_longitude decimal(10,7) null after pickup_latitude;
