insert into service_areas(pincode, area_name, active) values
    ('110080', 'Delhi NCR', true)
on duplicate key update area_name = values(area_name), active = true;

