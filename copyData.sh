 #!/bin/bash
tail /pass
rsync -avz -e "ssh -p 2121" data/* eldiario@195.81.194.111:/home/eldiario/html/lab/estaticos/plantaciones
