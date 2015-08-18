# !/bin/bash
PUBLISHED=/anfs/www/html/meters/elec/published

echo $PUBLISHED

echo "{ 
     \"item-metadata\":[
             {
                  \"rel\":\"urn:X-tsbiot:rels:isContentType\",
                  \"val\":\"application/vnd.tsbiot.catalogue+json\"
             },
             {
                  \"rel\":\"urn:X-tsbiot:rels:hasDescription:en\",
                  \"val\":\"Sensor Data\"
             },
             {
                  \"rel\":\"urn:X-tsbiot:rels:supportsSearch\",
                  \"val\":\"urn:X-tsbiot:search:simple\"
             }
        ],
        \"items\":[
             " > cat 


for meter in $PUBLISHED/*; do

    for file in $meter/*; do
	
	if [[ "$(basename $file)" == S-m*-????-??.json ]]; then
	    
	    newfile=`echo $(basename $file) | cut -d '.' -f 1`
	    year=`echo $newfile | cut -d '-' -f 3`
	    month=`echo $newfile | cut -d '-' -f 4`
	   
	    echo "          {
              \"href\":\"http://www.cl.cam.ac.uk/meters/elec/published/$(basename $meter)/$(basename $file)\",
              \"i-object-metadata\":[
                   {
                       \"rel\":\"urn:X-tsbiot:rels:isContentType\",
                       \"val\":\"application/json\"
                   },
                   {
                       \"rel\":\"urn:X-tsbiot:hasDescription:en\",
                       \"val\":\"$newfile\"
                   },
                   {
                       \"rel\":\"urn:X-tsbiot:hasParent\",
                       \"val\":\"$(basename $meter)\"
                   },
                   {
                       \"rel\":\"urn:X-tsbiot:Year\",
                       \"val\":\"$year\"
                   },
                   {
                       \"rel\":\"urn:X-tsbiot:Month\",
                       \"val\":\"$month\"
                   }
                ]
          }," >> cat
	    echo $(basename $file)
	fi
    done
done

sed -i '$ s/,$/ /' cat

echo "      ]
}" >> text.json


    
