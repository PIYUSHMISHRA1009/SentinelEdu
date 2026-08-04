-- Check if INSIGHTFLOW exists (optional)
SELECT username FROM dba_users WHERE username = 'INSIGHTFLOW';

-- Grant basic privileges
GRANT CONNECT, RESOURCE TO INSIGHTFLOW;

-- Grant object creation privileges
GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW TO INSIGHTFLOW;

-- Allow unlimited tablespace usage
GRANT UNLIMITED TABLESPACE TO INSIGHTFLOW;

-- Check the current container
SHOW CON_NAME;

-- List all PDBs
SELECT pdb_name, status FROM dba_pdbs;

-- Check which container your session is in
SELECT sys_context('USERENV','CON_NAME') FROM dual;
