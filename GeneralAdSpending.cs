using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;

public class GeneralAdSpending : MonoBehaviour
{
    public StateChoice sc;

    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    public void UpdateBar()
    {
        float amount = 0;
        foreach(KeyValuePair<string,string> stateInfo in sc.stateData)
        {
            var anArray = sc.stateData[stateInfo.Key].Split('\n');
            amount += (float.Parse(anArray[0]) + float.Parse(anArray[1]) + float.Parse(anArray[2]));
        }
        Variables.ActiveScene.Set("adExpenses", amount);
        string formattedNumber = string.Format("{0:n0}", amount);
        gameObject.GetComponent<TextMeshProUGUI>().text = "Spending: $" + formattedNumber;
    }

}
