# What is the plan? 

* plan is to listen for all transfer events
* get the receipt for a transfer event
* check if there is any weth that is transferred 
* if there is weth transferred in the transasction then there was a weth sale
* if not then check the value.
* if there is a value then that means there was sale for that "value" price
* make sure to save the transaction hash to a database.  
  * will there be problems with this? 
  if there is a bundle that is sold then i go through all smilesss that were transferred and post them as sold for the bundle price
  * this would work with GENIE as will.  