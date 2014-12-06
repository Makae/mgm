<?php

interface IMakae_GM_ContentProvider {

  public getData();

  public processData($data);

  public saveData($data);

}