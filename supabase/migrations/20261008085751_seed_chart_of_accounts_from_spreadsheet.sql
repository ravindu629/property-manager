/*
# Replace Chart of Accounts with spreadsheet expenditure categories

1. Changes
- Delete all existing rows from `chart_of_accounts` and re-seed with the 62 expenditure categories from the attached Chart_of_Accounts.xlsx plus the existing 7 income categories.
- Expenditure categories use codes 1000–9030 and are grouped by the Category column in the spreadsheet (e.g. Estate Management, Insurance, Repairs & Maintenance, etc.).
- Income categories retain codes 100–160 in the "Income" group.
- sort_order is set to match the sequential order of codes.

2. Security
- No RLS or policy changes.
*/

DELETE FROM chart_of_accounts;

-- Income categories (retained from original)
INSERT INTO chart_of_accounts (code, name, type, "group", is_active, sort_order) VALUES
('100','Ground Rent Income','income','Income',true,1),
('110','Service Charge Income','income','Income',true,2),
('120','Reserve Fund Contributions','income','Income',true,3),
('130','Sinking Fund Contributions','income','Income',true,4),
('140','Insurance Recoveries','income','Income',true,5),
('150','Interest Received','income','Income',true,6),
('160','Other Income','income','Income',true,7);

-- Expenditure categories from Chart_of_Accounts.xlsx
INSERT INTO chart_of_accounts (code, name, type, "group", is_active, sort_order) VALUES
('1000','Management Fee','expenditure','Estate Management',true,10),
('1010','Company Secretarial','expenditure','Estate Management',true,11),
('1020','Accountancy','expenditure','Estate Management',true,12),
('1030','Audit / Independent Accountant','expenditure','Estate Management',true,13),
('1040','Bank Charges','expenditure','Estate Management',true,14),
('1050','Legal Fees','expenditure','Estate Management',true,15),
('1060','Professional Fees','expenditure','Estate Management',true,16),
('1070','Companies House & Filing Fees','expenditure','Estate Management',true,17),
('1080','General Administration','expenditure','Estate Management',true,18),
('2000','Buildings Insurance','expenditure','Insurance',true,20),
('2010','Engineering Insurance','expenditure','Insurance',true,21),
('2020','Public Liability Insurance','expenditure','Insurance',true,22),
('2030','Directors & Officers Insurance','expenditure','Insurance',true,23),
('2040','Reinstatement Cost Assessment','expenditure','Insurance',true,24),
('2050','Insurance Excesses','expenditure','Insurance',true,25),
('2060','Insurance Claims Costs','expenditure','Insurance',true,26),
('3000','General Repairs','expenditure','Repairs & Maintenance',true,30),
('3010','Planned Maintenance','expenditure','Repairs & Maintenance',true,31),
('3020','Emergency Repairs','expenditure','Repairs & Maintenance',true,32),
('3030','External Decorations','expenditure','Repairs & Maintenance',true,33),
('3040','Internal Decorations','expenditure','Repairs & Maintenance',true,34),
('3050','Roof Repairs','expenditure','Repairs & Maintenance',true,35),
('3060','Drainage Repairs','expenditure','Repairs & Maintenance',true,36),
('3070','Structural Repairs','expenditure','Repairs & Maintenance',true,37),
('3080','Boundary Walls & Fencing','expenditure','Repairs & Maintenance',true,38),
('3090','Signage','expenditure','Repairs & Maintenance',true,39),
('4000','Gardening','expenditure','Grounds & External Areas',true,40),
('4010','Tree Works','expenditure','Grounds & External Areas',true,41),
('4020','Grounds Maintenance','expenditure','Grounds & External Areas',true,42),
('4030','Pest Control','expenditure','Grounds & External Areas',true,43),
('4040','Car Park Maintenance','expenditure','Grounds & External Areas',true,44),
('4050','Roadways & Footpaths','expenditure','Grounds & External Areas',true,45),
('4060','Landscaping','expenditure','Grounds & External Areas',true,46),
('5000','Communal Cleaning','expenditure','Cleaning & Waste',true,50),
('5010','Window Cleaning','expenditure','Cleaning & Waste',true,51),
('5020','Bin Store Cleaning','expenditure','Cleaning & Waste',true,52),
('5030','Refuse Collection','expenditure','Cleaning & Waste',true,53),
('5040','Graffiti Removal','expenditure','Cleaning & Waste',true,54),
('6000','Communal Electricity','expenditure','Utilities',true,60),
('6010','Communal Water','expenditure','Utilities',true,61),
('6020','Sewerage','expenditure','Utilities',true,62),
('6030','Gas','expenditure','Utilities',true,63),
('6040','Utility Standing Charges','expenditure','Utilities',true,64),
('7000','Fire Risk Assessment','expenditure','Health, Safety & Compliance',true,70),
('7010','Fire Equipment Servicing','expenditure','Health, Safety & Compliance',true,71),
('7020','Emergency Lighting','expenditure','Health, Safety & Compliance',true,72),
('7030','Electrical Testing','expenditure','Health, Safety & Compliance',true,73),
('7040','Asbestos Management','expenditure','Health, Safety & Compliance',true,74),
('7050','Legionella Assessment','expenditure','Health, Safety & Compliance',true,75),
('7060','Health & Safety Consultancy','expenditure','Health, Safety & Compliance',true,76),
('7070','Compliance Inspections','expenditure','Health, Safety & Compliance',true,77),
('8000','Lift Maintenance','expenditure','Mechanical & Electrical',true,80),
('8010','Lift Repairs','expenditure','Mechanical & Electrical',true,81),
('8020','Door Entry System','expenditure','Mechanical & Electrical',true,82),
('8030','CCTV','expenditure','Mechanical & Electrical',true,83),
('8040','Automatic Gates','expenditure','Mechanical & Electrical',true,84),
('8050','Fire Alarm System','expenditure','Mechanical & Electrical',true,85),
('8060','Access Control','expenditure','Mechanical & Electrical',true,86),
('9000','Reserve Fund Contribution','expenditure','Reserve Funds',true,90),
('9010','Major Works','expenditure','Reserve Funds',true,91),
('9020','Cyclical Decorations','expenditure','Reserve Funds',true,92),
('9030','Reserve Fund Expenditure','expenditure','Reserve Funds',true,93);
