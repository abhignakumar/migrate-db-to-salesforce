# import pandas as pd
# import pyodbc

# # === CONFIGURATION ===
# csv_file = 'data.csv'  # Path to your CSV file
# table_name = 'Customer'   # Target SQL table
# columns = ['CustomerID', 'Name', 'Email', 'Phone', 'Address']  # Must match CSV header & DB table columns

# # === DATABASE CONNECTION DETAILS ===
# server = 'abhigna.database.windows.net'
# database = 'LegacyCustomerDB'
# username = 'abhigna'
# password = 'Shravya@786'
# driver = '{ODBC Driver 18 for SQL Server}'

# # === READ CSV ===
# df = pd.read_csv(csv_file)

# # Optional: Validate columns match
# if set(columns) != set(df.columns):
#     raise ValueError("CSV columns don't match expected columns")

# # === CONNECT TO AZURE SQL ===
# conn_str = f'''
#     DRIVER={driver};
#     SERVER={server};
#     DATABASE={database};
#     UID={username};
#     PWD={password};
#     Encrypt=yes;
#     TrustServerCertificate=no;
#     Connection Timeout=30;
# '''
# conn = pyodbc.connect(conn_str)
# cursor = conn.cursor()

# # === INSERT ROWS ===
# insert_query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({', '.join(['?'] * len(columns))})"

# for _, row in df.iterrows():
#     values = [row[col] for col in columns]
#     cursor.execute(insert_query, values)

# # === COMMIT & CLOSE ===
# conn.commit()
# cursor.close()
# conn.close()

# print("✅ Data inserted successfully!")
import pyodbc
print(pyodbc.drivers())
