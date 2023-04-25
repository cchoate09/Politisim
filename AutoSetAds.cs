using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;

public class AutoSetAds : MonoBehaviour
{
    public StateChoice sc;
    public Button mButton;
    public float percAdSpending = 0.4f;
    public string[] dataArr = new string[3];
    public TextAsset txt;
    public List<string> lines;
    public Slider mSlider;
    public GameObject deactivate;

    // Start is called before the first frame update
    void Start()
    {
        mButton.onClick.AddListener(onButtonClick);
    }

    // Update is called once per frame
    void onButtonClick()
    {
        percAdSpending = mSlider.value;
        float delegateTotal = (float)Variables.Saved.Get("targetDelegates") * 2;
        float budgetTotal = (float)Variables.Saved.Get("CampaignBalance");
        bool dem = (bool)Variables.Saved.Get("Democrats");
        if (dem)
        {
            TextAsset txt = (TextAsset)Resources.Load("PrimaryStateData_D", typeof(TextAsset));
        }
        else
        {
            TextAsset txt = (TextAsset)Resources.Load("PrimaryStateData_R", typeof(TextAsset));
        }
        lines = (txt.text.Split('\n').ToList());
        foreach (string line in lines)
        {
            List<string> l = new List<string>(line.Split('\t').ToList());
            string sName = l[0];
            if (sc.stateData.ContainsKey(sName))
            {
                float percSpending = float.Parse(l[1])/delegateTotal;
                float adSpend = percSpending * percAdSpending * budgetTotal / 3f;
                dataArr[0] = adSpend.ToString();
                dataArr[1] = adSpend.ToString();
                dataArr[2] = adSpend.ToString();
                sc.stateData[sName] = string.Join('\n', dataArr);
            }
        }
        sc.DropdownValueChanged(sc.m_dropdown);
        deactivate.SetActive(false);
    }
}
