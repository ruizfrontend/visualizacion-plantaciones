 #!/bin/bash
tail /pass
rsync -avz -e "ssh -p 2121" demo/* eldiario@195.81.194.111:/home/eldiario/html/back/plantis

