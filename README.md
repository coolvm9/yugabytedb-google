# Lodging Recommendation Service with Google Vertex AI and YugabyteDB

This is a sample Node.js and React.js application that demonstrates how to build generative AI application using Google Vertex AI and YugabyteDB.

The application provides lodging recommendations for travelers visiting San Francisco.

<img width="1140" alt="Vertex AI Lodgings Application" src="https://github.com/YugabyteDB-Samples/yugabytedb-google-vertexai-lodging-service/assets/2041330/db4ad2d4-44d4-4a5e-af97-061e82848997">


Using Google Vertex AI, text embeddings (a vectorized representation of the data) are generated for each listing description and stored in YugabyteDB, using the PostgreSQL `pgvector` extension. The user's prompt is similarly converted to text embeddings using Google Vertex AI and subsequently used to execute a similarity search in YugabyteDB, finding properties with descriptions related to the user's prompt.

## Prerequisites

* A Google Cloud account with appropriate permissions
* A YugabyteDB cluster of version [2.19.2 or later](https://download.yugabyte.com/)
* Install Node.js v18+
* Install [Docker](https://docs.docker.com/get-docker/)

## Initializing the Project

1. Clone the repository.
   ```shell
     git clone https://github.com/YugabyteDB-Samples/yugabytedb-google-vertexai-lodging-service.git
   ```
2. Install the application dependencies.
    ```shell
      cd {project_directory}/backend
      npm install

      cd {project_directory}/frontend
      npm install
    ```
3. Configure the application environment variables in `{project_directory/backend/.env}`.

## Start YugabyteDB and Load the Sample Dataset 

1. Start a YugabyteDB isntance of version 2.19.2 or later:
```shell
mkdir ~/yb_docker_data

docker network create custom-network

docker run -d --name yugabytedb_node1 --net custom-network \
    -p 15433:15433 -p 7001:7000 -p 9001:9000 -p 5433:5433 \
    -v ~/yb_docker_data/node1:/home/yugabyte/yb_data --restart unless-stopped \
    yugabytedb/yugabyte:2.19.2.0-b121 \
    bin/yugabyted start \
    --base_dir=/home/yugabyte/yb_data --daemon=false

docker run -d --name yugabytedb_node2 --net custom-network \
    -p 15434:15433 -p 7002:7000 -p 9002:9000 -p 5434:5433 \
    -v ~/yb_docker_data/node2:/home/yugabyte/yb_data --restart unless-stopped \
    yugabytedb/yugabyte:2.19.2.0-b121 \
    bin/yugabyted start --join=yugabytedb_node1 \
    --base_dir=/home/yugabyte/yb_data --daemon=false
    
docker run -d --name yugabytedb_node3 --net custom-network \
    -p 15435:15433 -p 7003:7000 -p 9003:9000 -p 5435:5433 \
    -v ~/yb_docker_data/node3:/home/yugabyte/yb_data --restart unless-stopped \
    yugabytedb/yugabyte:2.19.2.0-b121 \
    bin/yugabyted start --join=yugabytedb_node1 \
    --base_dir=/home/yugabyte/yb_data --daemon=false
```

The database connectivity settings are provided in the `{project_dir}/backend/.env` file and do not need to be changed if you started the cluster with the command above.

2. Create the database schema.
    ```shell
        psql -h 127.0.0.1 -p 5433 -U yugabyte -d yugabyte -f {project_dir}/sql/0_airbnb_listings.sql
    ```

3. Load the sample dataset with properties in San Francisco.
    ```shell
        psql -h 127.0.0.1 -p 5433 -U yugabyte
    ```

    ```sql
    \copy airbnb_listing from '{project_directory}/sql/sf_airbnb_listings.csv' DELIMITER ',' CSV HEADER;
    ```

4. Add the PostgreSQL `pgvector` extension and `description_embedding` column of type vector.
    ```shell
        psql -h 127.0.0.1 -p 5433 -U yugabyte -d yugabyte -f {project_dir}/sql/1_airbnb_embeddings.sql
    ```

## Getting Started with Google Vertex AI

To start using Google Vertex AI in the application
1. Create a project in Google Cloud.
2. Enable the Vertex AI API.
3. Install the (gcloud command-line utility)[https://cloud.google.com/sdk/docs/install].
4. Log-in to Google Cloud via the CLI to run the application locally.
   ```shell
   gcloud auth application-default login
   ```
5. Update the Google Vertex AI environment variables in `{project_dir}/backend/.env`.

## Generate Embeddings for Airbnb Listing Descriptions

Airbnb properties come with detailed descriptions of of the accomodations, location, and various other features of the listing. By transforming the text in the `description` column of our database into a vectorized representation, we can use `pgvector` to execute a similarity search based on user prompts.

Execute the `embeddingsGenerator.js` script to generate embeddings in Google Vertex AI for each property, and store them in the `description_embedding` column in the database. This process can take over 10 minutes to complete.

```shell
    node {project_directory}/backend/vertex/embeddingsGenerator.js

    ....
    Processing rows starting from 34746755
    Processed 7551 rows
    Processing rows starting from 35291912
    Finished generating embeddings for 7551 rows
```

## Running the Application

1. Start the Node.js backend.
    ```
    cd {project_dir}/backend
    npm start
    ```
2. Start the React UI.
    ```
    npm run dev
    ```

3. Access the application UI at [http://localhost:5173](http://localhost:5173).

4. Test the application with relevant prompts. For instance: 

    *We're traveling to San Francisco from February 21st through 28th. We need a place to stay with parking available.*

    *I'm looking for an apartment near the Golden Gate Bridge with a nice view of the Bay.*

    *Full house with ocean views for family of 6.*

    *Room for 1 in downtown SF, walking distance to Moscone Center.*

<img width="1145" alt="Vertex AI Lodgings App with responses" src="https://github.com/YugabyteDB-Samples/yugabytedb-google-vertexai-lodging-service/assets/2041330/979cf7ce-f3dd-4f6a-ae79-1c5d60f38807">
# yugabytedb-google
