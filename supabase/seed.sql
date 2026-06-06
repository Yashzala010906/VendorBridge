-- ============================================================================
-- seed.sql — demo data for VendorBridge.
-- Uses NULL created_by so it can run before any auth users exist. Idempotent:
-- skips if vendors already present. Run via MCP execute_sql or the SQL editor.
-- ============================================================================
do $$
declare
  v_acme uuid; v_blue uuid; v_sterling uuid; v_nimbus uuid; v_green uuid; v_vertex uuid;
  r1 uuid; r2 uuid; r3 uuid; r4 uuid;
  q_n uuid; q_b uuid; q_s1 uuid; q_vx uuid; q_ac uuid; q_st uuid; q_gr uuid;
  po1 uuid;
begin
  if exists (select 1 from public.vendors) then
    raise notice 'Seed skipped — vendors already exist.';
    return;
  end if;

  -- Vendors -----------------------------------------------------------------
  insert into public.vendors (name, category, gst_number, email, phone, contact_person, city, status, rating) values
    ('Acme Industrial Supplies','Industrial','27AABCU9603R1ZM','sales@acme-industrial.example','+91 98200 11111','Rahul Mehta','Mumbai','active',4.5) returning id into v_acme;
  insert into public.vendors (name, category, gst_number, email, phone, contact_person, city, status, rating) values
    ('BluePeak Electronics','Electronics','29AAGCB1234M1Z6','contact@bluepeak.example','+91 98450 22222','Sneha Rao','Bengaluru','active',4.2) returning id into v_blue;
  insert into public.vendors (name, category, gst_number, email, phone, contact_person, city, status, rating) values
    ('Sterling Office Solutions','Office Supplies','07AAACS5678P1Z2','hello@sterlingoffice.example','+91 98110 33333','Imran Sheikh','New Delhi','active',3.8) returning id into v_sterling;
  insert into public.vendors (name, category, gst_number, email, phone, contact_person, city, status, rating) values
    ('Nimbus IT Hardware','IT Hardware','27AAFCN4321Q1Z9','procurement@nimbusit.example','+91 99300 44444','Anita Desai','Pune','active',4.7) returning id into v_nimbus;
  insert into public.vendors (name, category, gst_number, email, phone, contact_person, city, status, rating) values
    ('GreenLeaf Packaging','Packaging','24AAJCG8765L1Z1','orders@greenleaf.example','+91 99250 55555','Karan Patel','Ahmedabad','active',4.0) returning id into v_green;
  insert into public.vendors (name, category, gst_number, email, phone, contact_person, city, status, rating) values
    ('Vertex Safety Equipment','Safety','33AAKCV2468R1Z7','sales@vertexsafety.example','+91 98400 66666','Priya Nair','Chennai','pending',3.5) returning id into v_vertex;

  -- RFQ 1: Office Laptops -----------------------------------------------------
  insert into public.rfqs (title, description, category, status, deadline)
    values ('Office Laptops Procurement — Q3','Bulk purchase of developer laptops with docking stations and peripherals for the new engineering team.','IT Hardware','published', now() + interval '12 days')
    returning id into r1;
  insert into public.rfq_items (rfq_id, product_name, description, quantity, unit, position) values
    (r1,'Laptop — Core i7, 16GB RAM, 512GB SSD','14" business laptop, 3yr warranty',25,'unit',0),
    (r1,'USB-C Docking Station','Dual 4K display support',25,'unit',1),
    (r1,'Wireless Mouse','Ergonomic, USB receiver',25,'unit',2);
  insert into public.rfq_vendors (rfq_id, vendor_id, has_responded) values
    (r1,v_nimbus,true),(r1,v_blue,true),(r1,v_sterling,true);

  -- RFQ 2: Safety Gear --------------------------------------------------------
  insert into public.rfqs (title, description, category, status, deadline)
    values ('Industrial Safety Gear — Plant B','Personal protective equipment for the new manufacturing line.','Safety','published', now() + interval '8 days')
    returning id into r2;
  insert into public.rfq_items (rfq_id, product_name, description, quantity, unit, position) values
    (r2,'Safety Helmet','ISI-marked, adjustable',100,'unit',0),
    (r2,'Reflective Vest','High-visibility, size L',100,'unit',1),
    (r2,'Steel-toe Boots','Oil & slip resistant',80,'pair',2);
  insert into public.rfq_vendors (rfq_id, vendor_id, has_responded) values
    (r2,v_vertex,true),(r2,v_acme,true);

  -- RFQ 3: Stationery (will be awarded -> PO -> Invoice) ----------------------
  insert into public.rfqs (title, description, category, status, deadline)
    values ('Office Stationery — Annual Contract','Recurring supply of office stationery for all branches.','Office Supplies','awarded', now() - interval '2 days')
    returning id into r3;
  insert into public.rfq_items (rfq_id, product_name, description, quantity, unit, position) values
    (r3,'A4 Paper Ream (500 sheets)','75 GSM, premium white',500,'ream',0),
    (r3,'Whiteboard Marker','Assorted colours, low-odour',200,'unit',1);
  insert into public.rfq_vendors (rfq_id, vendor_id, has_responded) values
    (r3,v_sterling,true),(r3,v_green,true);

  -- RFQ 4: draft (no invitations) --------------------------------------------
  insert into public.rfqs (title, description, category, status, deadline)
    values ('Server Rack Upgrade — Data Centre','Expansion of rack capacity for the primary data centre.','IT Hardware','draft', now() + interval '20 days')
    returning id into r4;
  insert into public.rfq_items (rfq_id, product_name, description, quantity, unit, position) values
    (r4,'42U Server Rack','Closed, with cable management',2,'unit',0),
    (r4,'Rack PDU','Metered, 16A',4,'unit',1);

  -- Quotations for RFQ 1 ------------------------------------------------------
  insert into public.quotations (rfq_id, vendor_id, status, delivery_days, notes, total_amount, submitted_at)
    values (r1,v_nimbus,'shortlisted',10,'Includes on-site setup and 3-year ADP warranty.',2030000, now() - interval '3 days') returning id into q_n;
  insert into public.quotation_items (quotation_id, product_name, quantity, unit_price, line_total) values
    (q_n,'Laptop — Core i7, 16GB RAM, 512GB SSD',25,72000,1800000),
    (q_n,'USB-C Docking Station',25,8000,200000),
    (q_n,'Wireless Mouse',25,1200,30000);

  insert into public.quotations (rfq_id, vendor_id, status, delivery_days, notes, total_amount, submitted_at)
    values (r1,v_blue,'submitted',7,'Fastest delivery; bulk discount applied.',2100000, now() - interval '2 days') returning id into q_b;
  insert into public.quotation_items (quotation_id, product_name, quantity, unit_price, line_total) values
    (q_b,'Laptop — Core i7, 16GB RAM, 512GB SSD',25,75000,1875000),
    (q_b,'USB-C Docking Station',25,7500,187500),
    (q_b,'Wireless Mouse',25,1500,37500);

  insert into public.quotations (rfq_id, vendor_id, status, delivery_days, notes, total_amount, submitted_at)
    values (r1,v_sterling,'submitted',14,'Premium models, extended support.',2200000, now() - interval '2 days') returning id into q_s1;
  insert into public.quotation_items (quotation_id, product_name, quantity, unit_price, line_total) values
    (q_s1,'Laptop — Core i7, 16GB RAM, 512GB SSD',25,78000,1950000),
    (q_s1,'USB-C Docking Station',25,9000,225000),
    (q_s1,'Wireless Mouse',25,1000,25000);

  -- Quotations for RFQ 2 ------------------------------------------------------
  insert into public.quotations (rfq_id, vendor_id, status, delivery_days, notes, total_amount, submitted_at)
    values (r2,v_vertex,'submitted',12,'All items ISI certified.',173000, now() - interval '1 days') returning id into q_vx;
  insert into public.quotation_items (quotation_id, product_name, quantity, unit_price, line_total) values
    (q_vx,'Safety Helmet',100,350,35000),
    (q_vx,'Reflective Vest',100,180,18000),
    (q_vx,'Steel-toe Boots',80,1500,120000);

  insert into public.quotations (rfq_id, vendor_id, status, delivery_days, notes, total_amount, submitted_at)
    values (r2,v_acme,'submitted',15,'Lowest unit price on boots.',167000, now() - interval '1 days') returning id into q_ac;
  insert into public.quotation_items (quotation_id, product_name, quantity, unit_price, line_total) values
    (q_ac,'Safety Helmet',100,400,40000),
    (q_ac,'Reflective Vest',100,150,15000),
    (q_ac,'Steel-toe Boots',80,1400,112000);

  -- Quotations for RFQ 3 (Sterling accepted) ---------------------------------
  insert into public.quotations (rfq_id, vendor_id, status, delivery_days, notes, total_amount, submitted_at)
    values (r3,v_sterling,'accepted',5,'Preferred vendor, fastest delivery.',134000, now() - interval '6 days') returning id into q_st;
  insert into public.quotation_items (quotation_id, product_name, quantity, unit_price, line_total) values
    (q_st,'A4 Paper Ream (500 sheets)',500,250,125000),
    (q_st,'Whiteboard Marker',200,45,9000);

  insert into public.quotations (rfq_id, vendor_id, status, delivery_days, notes, total_amount, submitted_at)
    values (r3,v_green,'rejected',8,'Marginally cheaper paper.',130000, now() - interval '6 days') returning id into q_gr;
  insert into public.quotation_items (quotation_id, product_name, quantity, unit_price, line_total) values
    (q_gr,'A4 Paper Ream (500 sheets)',500,240,120000),
    (q_gr,'Whiteboard Marker',200,50,10000);

  -- Approvals -----------------------------------------------------------------
  insert into public.approvals (rfq_id, quotation_id, status, remarks, decided_at)
    values (r3,q_st,'approved','Approved — preferred vendor with reliable delivery record.', now() - interval '5 days');
  insert into public.approvals (rfq_id, quotation_id, status, remarks)
    values (r1,q_n,'pending', null);

  -- Purchase Order + items (from the approved Sterling quotation) -------------
  insert into public.purchase_orders (quotation_id, rfq_id, vendor_id, status, subtotal, tax_rate, tax_amount, total_amount, expected_delivery, notes)
    values (q_st, r3, v_sterling, 'acknowledged', 134000, 18, 24120, 158120, (current_date + 5), 'Deliver to Central Stores, Gate 2.')
    returning id into po1;
  insert into public.po_items (po_id, product_name, quantity, unit_price, line_total) values
    (po1,'A4 Paper Ream (500 sheets)',500,250,125000),
    (po1,'Whiteboard Marker',200,45,9000);

  -- Invoice + items -----------------------------------------------------------
  insert into public.invoices (po_id, vendor_id, status, subtotal, tax_rate, tax_amount, total_amount, issue_date, due_date, notes)
    values (po1, v_sterling, 'sent', 134000, 18, 24120, 158120, current_date - 4, current_date + 26, 'Net 30. Annual stationery contract — first dispatch.');
  insert into public.invoice_items (invoice_id, description, quantity, unit_price, line_total)
    select id, 'A4 Paper Ream (500 sheets)', 500, 250, 125000 from public.invoices where po_id = po1
    union all
    select id, 'Whiteboard Marker', 200, 45, 9000 from public.invoices where po_id = po1;

  -- Activity log --------------------------------------------------------------
  insert into public.activity_logs (action, entity_type, description, created_at) values
    ('rfq.published','rfq','RFQ "Office Laptops Procurement — Q3" published to 3 vendors', now() - interval '4 days'),
    ('quotation.submitted','quotation','Nimbus IT Hardware submitted a quotation for Office Laptops', now() - interval '3 days'),
    ('quotation.submitted','quotation','BluePeak Electronics submitted a quotation for Office Laptops', now() - interval '2 days'),
    ('approval.approved','approval','Sterling Office Solutions quotation approved for Office Stationery', now() - interval '5 days'),
    ('po.created','purchase_order','Purchase order issued to Sterling Office Solutions', now() - interval '4 days 12 hours'),
    ('invoice.sent','invoice','Invoice sent to Sterling Office Solutions (₹1,58,120)', now() - interval '4 days');

  raise notice 'Seed complete.';
end $$;
